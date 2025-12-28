/**
 * Property Test: API认证一致性 (API Authentication Consistency)
 * 
 * **Property 1: API认证一致性**
 * *For any* API端点（除公开端点如login、register外），当请求不包含有效的认证token时，
 * 系统应返回401状态码。
 * 
 * **Validates: Requirements 3.1, 3.3**
 * 
 * Feature: project-diagnosis-improvement, Property 1: API认证一致性
 */

import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '../middleware/auth';
import { generateToken, JwtPayload } from '../auth';

// Mock handler that returns success
const mockHandler = async ({ user }: AuthContext) => {
  return new Response(JSON.stringify({ success: true, data: { userId: user.userId } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper to create a mock NextRequest
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const { method = 'GET', url = 'http://localhost:3000/api/test', headers = {} } = options;
  
  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });
}

// Generate valid JWT payload
const validPayloadArbitrary = fc.record({
  userId: fc.uuid(),
  email: fc.emailAddress(),
  role: fc.constantFrom('admin', 'enterprise_admin', 'department_manager', 'employee'),
  enterpriseId: fc.option(fc.uuid(), { nil: undefined }),
});

// Generate invalid tokens
const invalidTokenArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('invalid-token'),
  fc.constant('Bearer'),
  fc.constant('abc123def456'),
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('.')),
);

describe('API Authentication Consistency - Property 1', () => {
  /**
   * Property: For any request without a token, the middleware should return 401
   */
  it('should return 401 for requests without authorization header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (method) => {
          const wrappedHandler = withAuth(mockHandler);
          const request = createMockRequest({ method });
          
          const response = await wrappedHandler(request);
          const data = await response.json();
          
          expect(response.status).toBe(401);
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
          expect(data.error.code).toBe('AUTH_001');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any request with an invalid token, the middleware should return 401
   */
  it('should return 401 for requests with invalid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidTokenArbitrary,
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (invalidToken, method) => {
          const wrappedHandler = withAuth(mockHandler);
          const request = createMockRequest({
            method,
            headers: { Authorization: `Bearer ${invalidToken}` },
          });
          
          const response = await wrappedHandler(request);
          const data = await response.json();
          
          expect(response.status).toBe(401);
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
          // Should be either AUTH_001 (no token) or AUTH_002 (invalid token)
          expect(['AUTH_001', 'AUTH_002']).toContain(data.error.code);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any request with a valid token, the middleware should allow access
   */
  it('should allow access for requests with valid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (payload, method) => {
          const token = generateToken(payload as JwtPayload);
          const wrappedHandler = withAuth(mockHandler);
          const request = createMockRequest({
            method,
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const response = await wrappedHandler(request);
          const data = await response.json();
          
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.userId).toBe(payload.userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Role-based access control should work correctly
   */
  it('should enforce role-based access control', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        fc.constantFrom(['admin'], ['enterprise_admin'], ['department_manager'], ['employee']),
        async (payload, allowedRoles) => {
          const token = generateToken(payload as JwtPayload);
          const wrappedHandler = withAuth(mockHandler, { roles: allowedRoles as any });
          const request = createMockRequest({
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const response = await wrappedHandler(request);
          const data = await response.json();
          
          const userRole = payload.role;
          const hasAccess = allowedRoles.includes(userRole);
          
          if (hasAccess) {
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
          } else {
            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('AUTH_003');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Enterprise requirement should be enforced
   */
  it('should enforce enterprise requirement when specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        async (payload) => {
          const token = generateToken(payload as JwtPayload);
          const wrappedHandler = withAuth(mockHandler, { requireEnterprise: true });
          const request = createMockRequest({
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const response = await wrappedHandler(request);
          const data = await response.json();
          
          if (payload.enterpriseId) {
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
          } else {
            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('AUTH_004');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
