import { GET, POST } from '../route';
import { createMockRequest, createMockUser, createMockJwtPayload } from '@/test-utils';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { withAuth } from '@/lib/middleware/auth';
import { mockConsole } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(() => '$2a$10$hashedpassword'),
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/middleware/auth', () => ({
  withAuth: (handler: any, options?: any) => {
    return async (request: any, context?: any) => {
      // Mock auth context
      const authContext = {
        user: {
          id: 'current-user-id',
          email: 'current@example.com',
          name: 'Current User',
          role: 'ENTERPRISE_ADMIN',
          enterpriseId: 'enterprise-1',
        },
        request,
      };
      return handler(authContext, context);
    };
  },
}));

describe('/api/enterprise/users', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'EMPLOYEE',
      position: '前端工程师',
      departmentId: 'dept-1',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'user-2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'MANAGER',
      position: '技术经理',
      departmentId: 'dept-2',
      createdAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all users for the enterprise', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/users',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data).toEqual(mockUsers);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          enterpriseId: 'enterprise-1',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          departmentId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should filter users by department', async () => {
      // Arrange
      const deptUsers = [mockUsers[0]];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(deptUsers);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/users?departmentId=dept-1',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].departmentId).toBe('dept-1');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          enterpriseId: 'enterprise-1',
          departmentId: 'dept-1',
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should handle empty user list', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/users',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (prisma.user.findMany as jest.Mock).mockRejectedValue(dbError);

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/users',
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_LIST_FAILED');
      expect(mocks.error).toHaveBeenCalledWith('Error fetching enterprise users:', dbError);

      restore();
    });
  });

  describe('POST', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: 'EMPLOYEE',
        departmentId: 'dept-1',
        position: '后端工程师',
      };

      const createdUser = {
        id: 'user-new',
        ...newUserData,
        password: '$2a$10$hashedpassword',
        enterpriseId: 'enterprise-1',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const request = createMockRequest({
        method: 'POST',
        body: newUserData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'user-new',
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        position: newUserData.position,
        departmentId: newUserData.departmentId,
      });
      expect(data.data.password).toBeUndefined();

      expect(hashPassword).toHaveBeenCalledWith('Password123!');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: newUserData.name,
          email: newUserData.email,
          password: '$2a$10$hashedpassword',
          role: newUserData.role,
          position: newUserData.position,
          enterpriseId: 'enterprise-1',
          departmentId: newUserData.departmentId,
        },
      });
    });

    it('should reject if user is not admin or manager', async () => {
      // Mock auth context with EMPLOYEE role
      jest.mocked(withAuth).mockImplementationOnce((handler: any) => {
        return async (request: any) => {
          const authContext = {
            user: {
              id: 'employee-id',
              email: 'employee@example.com',
              name: 'Employee User',
              role: 'EMPLOYEE',
              enterpriseId: 'enterprise-1',
            },
            request,
          };
          return handler(authContext);
        };
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!',
        },
      });

      // Re-import to get the new mock
      const { POST: mockedPOST } = require('../route');

      // Act
      const response = await mockedPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject duplicate email', async () => {
      // Arrange
      const newUserData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });

      const request = createMockRequest({
        method: 'POST',
        body: newUserData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_EMAIL_EXISTS');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      // Test missing email
      let request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          password: 'Password123!',
        },
      });

      let response = await POST(request);
      let data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_001');

      // Test missing name
      request = createMockRequest({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'Password123!',
        },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');

      // Test missing password
      request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          email: 'newuser@example.com',
        },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');
    });

    it('should validate email format', async () => {
      // Arrange
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          email: 'invalid-email',
          password: 'Password123!',
        },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');
      expect(data.error.details.email).toBeDefined();
    });

    it('should validate password strength', async () => {
      // Arrange
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'weak',
        },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');
      expect(data.error.details.password).toBeDefined();
    });

    it('should set default role to EMPLOYEE if not provided', async () => {
      // Arrange
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-new',
        ...newUserData,
        role: 'EMPLOYEE',
        enterpriseId: 'enterprise-1',
        createdAt: new Date(),
      });

      const request = createMockRequest({
        method: 'POST',
        body: newUserData,
      });

      // Act
      await POST(request);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'EMPLOYEE',
        }),
      });
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-new',
        ...newUserData,
        role: 'EMPLOYEE',
        position: null,
        departmentId: null,
        enterpriseId: 'enterprise-1',
        createdAt: new Date(),
      });

      const request = createMockRequest({
        method: 'POST',
        body: newUserData,
      });

      // Act
      await POST(request);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position: null,
          departmentId: null,
        }),
      });
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'POST',
        body: newUserData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_CREATE_FAILED');
      expect(mocks.error).toHaveBeenCalled();

      restore();
    });
  });
});