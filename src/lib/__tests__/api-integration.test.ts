/**
 * API Integration Tests: 认证API集成测试
 * 
 * Tests for login API, register API, and protected API authentication.
 * 
 * **Validates: Requirements 7.2**
 * 
 * Feature: project-diagnosis-improvement
 */

import { NextRequest } from 'next/server';
import { generateToken, hashPassword, type JwtPayload } from '../auth';

// Mock Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    enterprise: {
      findUnique: jest.fn(),
    },
  },
}));

// Import after mocking
import { prisma } from '../prisma';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';


// Helper to create mock NextRequest
function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login API', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: '', // Will be set in beforeEach
      role: 'EMPLOYEE',
      enterpriseId: 'enterprise-456',
    };

    beforeEach(async () => {
      mockUser.password = await hashPassword('password123');
    });

    it('should return token for valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.email).toBe(mockUser.email);
    });

    it('should return error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_005');
    });

    it('should return error for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_006');
    });

    it('should return validation error for missing email', async () => {
      const request = createMockRequest({
        password: 'password123',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('should return validation error for missing password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('should return validation error for invalid email format', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'password123',
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });
  });

  describe('Register API', () => {
    it('should create user and return token for valid registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-123',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'ENTERPRISE_ADMIN',
        enterpriseId: null,
      });

      const request = createMockRequest({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.email).toBe('newuser@example.com');
    });

    it('should return error for existing email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });

      const request = createMockRequest({
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('REG_001');
    });

    it('should return error for invalid enterprise code', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        enterpriseCode: 'INVALID_CODE',
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('REG_002');
    });

    it('should create user with enterprise when valid code provided', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue({
        id: 'enterprise-123',
        code: 'VALID_CODE',
      });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-123',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'EMPLOYEE',
        enterpriseId: 'enterprise-123',
      });

      const request = createMockRequest({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        enterpriseCode: 'VALID_CODE',
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.enterpriseId).toBe('enterprise-123');
    });

    it('should return validation error for missing name', async () => {
      const request = createMockRequest({
        email: 'newuser@example.com',
        password: 'password123',
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('should return validation error for short password', async () => {
      const request = createMockRequest({
        name: 'New User',
        email: 'newuser@example.com',
        password: '12345', // Less than 6 characters
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });
  });

  describe('Protected API Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const { withAuth, AuthContext } = await import('../middleware/auth');

      const mockHandler = async ({ user }: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      const wrappedHandler = withAuth(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/protected');

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_001');
    });

    it('should reject requests with invalid token', async () => {
      const { withAuth, AuthContext } = await import('../middleware/auth');

      const mockHandler = async ({ user }: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      const wrappedHandler = withAuth(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_002');
    });

    it('should allow requests with valid token', async () => {
      const { withAuth, AuthContext } = await import('../middleware/auth');

      const payload: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        enterpriseId: 'enterprise-456',
      };
      const token = generateToken(payload);

      const mockHandler = async ({ user }: AuthContext) => {
        return new Response(JSON.stringify({ success: true, userId: user.userId }), { status: 200 });
      };

      const wrappedHandler = withAuth(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe(payload.userId);
    });

    it('should enforce role-based access control', async () => {
      const { withAuth, AuthContext } = await import('../middleware/auth');

      const payload: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
      const token = generateToken(payload);

      const mockHandler = async ({ user }: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      // Require admin role
      const wrappedHandler = withAuth(mockHandler, { roles: ['admin'] });
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_003');
    });

    it('should enforce enterprise requirement', async () => {
      const { withAuth, AuthContext } = await import('../middleware/auth');

      const payload: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        // No enterpriseId
      };
      const token = generateToken(payload);

      const mockHandler = async ({ user }: AuthContext) => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      const wrappedHandler = withAuth(mockHandler, { requireEnterprise: true });
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_004');
    });
  });
});
