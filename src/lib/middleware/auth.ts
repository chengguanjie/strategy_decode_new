import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, JwtPayload } from '../auth';

/**
 * Allowed user roles in the system
 */
export type UserRole = 'admin' | 'enterprise_admin' | 'department_manager' | 'employee';

/**
 * Extended request interface with authenticated user information
 */
export interface AuthenticatedRequest extends NextRequest {
  /** The authenticated user's JWT payload */
  user: JwtPayload;
}

/**
 * Authentication context passed to protected route handlers
 */
export interface AuthContext {
  /** The authenticated user's JWT payload */
  user: JwtPayload;
  /** The original Next.js request object */
  request: NextRequest;
}

/**
 * Handler function type for authenticated routes
 * @param context - The authentication context containing user and request
 * @param params - Optional route parameters
 * @returns A promise resolving to a NextResponse
 */
export type AuthenticatedHandler = (
  context: AuthContext,
  params?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Configuration options for the withAuth middleware
 */
export interface WithAuthOptions {
  /** Array of roles allowed to access the route. If empty, any authenticated user can access */
  roles?: UserRole[];
  /** If true, requires the user to be associated with an enterprise */
  requireEnterprise?: boolean;
}

/**
 * Higher-order function to wrap API routes with authentication.
 * Validates JWT tokens and optionally checks role permissions.
 * 
 * @param handler - The route handler function to protect
 * @param options - Authentication options (roles, requireEnterprise)
 * @returns Wrapped handler with authentication middleware
 * 
 * @example
 * // Basic authentication - any authenticated user can access
 * export const GET = withAuth(async ({ user, request }) => {
 *   return NextResponse.json({ data: user });
 * });
 * 
 * @example
 * // With role restriction - only admin and enterprise_admin can access
 * export const POST = withAuth(
 *   async ({ user, request }) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   { roles: ['admin', 'enterprise_admin'] }
 * );
 * 
 * @example
 * // Require enterprise association
 * export const GET = withAuth(
 *   async ({ user, request }) => {
 *     // user.enterpriseId is guaranteed to exist
 *     return NextResponse.json({ enterpriseId: user.enterpriseId });
 *   },
 *   { requireEnterprise: true }
 * );
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: WithAuthOptions = {}
) {
  return async (
    request: NextRequest,
    params?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    // Extract and verify token
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_001',
            message: '未提供认证令牌',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_002',
            message: '无效或过期的认证令牌',
          },
        },
        { status: 401 }
      );
    }

    // Check role permissions if specified
    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(user.role as UserRole)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTH_003',
              message: '无权访问此资源',
            },
          },
          { status: 403 }
        );
      }
    }

    // Check enterprise requirement if specified
    if (options.requireEnterprise && !user.enterpriseId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_004',
            message: '需要企业关联才能访问此资源',
          },
        },
        { status: 403 }
      );
    }

    // Call the handler with authenticated context
    return handler({ user, request }, params);
  };
}

/**
 * Utility function to check if a user has one of the specified roles.
 * 
 * @param user - The JWT payload containing user information
 * @param roles - Array of roles to check against
 * @returns True if the user has one of the specified roles
 * 
 * @example
 * if (hasRole(user, ['admin', 'enterprise_admin'])) {
 *   // User has admin privileges
 * }
 */
export function hasRole(user: JwtPayload, roles: UserRole[]): boolean {
  return roles.includes(user.role as UserRole);
}

/**
 * Utility function to check if a user belongs to a specific enterprise.
 * 
 * @param user - The JWT payload containing user information
 * @param enterpriseId - The enterprise ID to check against
 * @returns True if the user belongs to the specified enterprise
 * 
 * @example
 * if (belongsToEnterprise(user, 'enterprise-123')) {
 *   // User belongs to this enterprise
 * }
 */
export function belongsToEnterprise(user: JwtPayload, enterpriseId: string): boolean {
  return user.enterpriseId === enterpriseId;
}
