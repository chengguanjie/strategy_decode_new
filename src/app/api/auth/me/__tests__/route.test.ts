import { GET } from '../route';
import { createMockRequest, createMockJwtPayload } from '@/test-utils';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { mockConsole } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  getUserFromRequest: jest.fn(),
  getTokenFromRequest: jest.fn(),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
}));

describe('/api/auth/me', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'EMPLOYEE',
    avatar: 'https://example.com/avatar.jpg',
    enterpriseId: 'enterprise-1',
    enterprise: {
      id: 'enterprise-1',
      name: 'Test Enterprise',
    },
  };

  const mockJwtPayload = createMockJwtPayload({
    userId: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
    enterpriseId: mockUser.enterpriseId,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return current user info with valid token', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        avatar: mockUser.avatar,
        enterpriseId: mockUser.enterpriseId,
        enterprise: mockUser.enterprise,
      });
      expect(getUserFromRequest).toHaveBeenCalledWith(request);
    });

    it('should return 401 when no authorization header', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(null);

      const request = createMockRequest({
        method: 'GET',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_004',
        message: '缺少认证令牌',
      });
      expect(getUserFromRequest).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(null);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'InvalidFormat token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_004',
        message: '缺少认证令牌',
      });
    });

    it('should return 401 when token verification fails', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(null);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_004',
        message: '缺少认证令牌',
      });
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_005',
        message: '用户不存在',
      });
    });

    it('should handle user without enterprise', async () => {
      // Arrange
      const userWithoutEnterprise = { ...mockUser, enterprise: null };
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutEnterprise);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.enterprise).toBeNull();
    });

    it('should handle user without avatar', async () => {
      // Arrange
      const minimalUser = {
        ...mockUser,
        avatar: null,
      };
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(minimalUser);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.avatar).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_008',
        message: '获取用户信息失败',
      });
      expect(mocks.error).toHaveBeenCalledWith('Get user error:', expect.any(Error));

      restore();
    });

    it('should handle token verification errors', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer malformed-token',
        },
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_008',
        message: '获取用户信息失败',
      });

      restore();
    });

    it('should include correct Prisma query', async () => {
      // Arrange
      (getUserFromRequest as jest.Mock).mockReturnValue(mockJwtPayload);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createMockRequest({
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      // Act
      await GET(request);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockJwtPayload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          enterpriseId: true,
          enterprise: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

  });
});