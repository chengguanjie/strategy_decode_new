import { POST } from '../route';
import { createMockRequest } from '@/test-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockConsole } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    enterprise: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => '$2a$10$hashedpassword'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));

describe('/api/auth/register', () => {
  const mockEnterprise = {
    id: 'enterprise-1',
    name: 'Test Enterprise',
    code: 'TEST001',
    status: 'ACTIVE',
  };

  const mockNewUser = {
    id: 'user-1',
    email: 'newuser@example.com',
    password: '$2a$10$hashedpassword',
    name: '新用户',
    role: 'EMPLOYEE',
    enterpriseId: 'enterprise-1',
    enterprise: mockEnterprise,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(mockEnterprise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        token: 'mock-token',
        user: {
          id: mockNewUser.id,
          email: mockNewUser.email,
          name: mockNewUser.name,
          role: mockNewUser.role,
          enterpriseId: mockNewUser.enterpriseId,
        },
      });
      expect(data.data.user.password).toBeUndefined();
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    });

    it('should reject registration with invalid enterprise code', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'INVALID',
      };

      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'ENTERPRISE_001',
        message: '企业不存在',
      });
    });

    it('should reject registration with inactive enterprise', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      const inactiveEnterprise = { ...mockEnterprise, status: 'INACTIVE' };
      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(inactiveEnterprise);

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'ENTERPRISE_002',
        message: '企业已被禁用',
      });
    });

    it('should reject registration with existing email', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(mockEnterprise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_002',
        message: '邮箱已被注册',
      });
    });

    it('should validate required fields', async () => {
      // Test missing email
      let request = createMockRequest({
        method: 'POST',
        body: {
          password: 'Password123!',
          name: '新用户',
          enterpriseCode: 'TEST001',
        },
      });

      let response = await POST(request);
      let data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');

      // Test missing password
      request = createMockRequest({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          name: '新用户',
          enterpriseCode: 'TEST001',
        },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');

      // Test missing name
      request = createMockRequest({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'Password123!',
          enterpriseCode: 'TEST001',
        },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');

      // Test missing enterpriseCode
      request = createMockRequest({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'Password123!',
          name: '新用户',
        },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');
    });

    it('should validate email format', async () => {
      // Arrange
      const registerData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_001');
      expect(data.error.details.email).toContain('必须是有效的邮箱地址');
    });

    it('should validate password strength', async () => {
      // Test weak password
      const weakPasswords = [
        'short',           // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!',      // No numbers
        'NoSpecial123',    // No special characters
      ];

      for (const password of weakPasswords) {
        const request = createMockRequest({
          method: 'POST',
          body: {
            email: 'newuser@example.com',
            password,
            name: '新用户',
            enterpriseCode: 'TEST001',
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe('VALIDATION_001');
        expect(data.error.details.password).toBeDefined();
      }
    });

    it('should handle transaction rollback on error', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(mockEnterprise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        try {
          return await fn(prisma);
        } catch (error) {
          throw error;
        }
      });

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'INTERNAL_001',
        message: '服务器内部错误',
      });
      expect(mocks.error).toHaveBeenCalled();

      restore();
    });

    it('should trim and lowercase email', async () => {
      // Arrange
      const registerData = {
        email: '  NEWUSER@EXAMPLE.COM  ',
        password: 'Password123!',
        name: '新用户',
        enterpriseCode: 'TEST001',
      };

      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue(mockEnterprise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      await POST(request);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newuser@example.com',
          }),
        })
      );
    });

    it('should create user with first admin role if no users exist in enterprise', async () => {
      // Arrange
      const registerData = {
        email: 'firstuser@example.com',
        password: 'Password123!',
        name: '第一个用户',
        enterpriseCode: 'TEST001',
      };

      // Mock to simulate no existing users in enterprise
      (prisma.enterprise.findUnique as jest.Mock).mockResolvedValue({
        ...mockEnterprise,
        users: [], // Empty users array
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockNewUser,
        role: 'ADMIN',
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      const request = createMockRequest({
        method: 'POST',
        body: registerData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.data.user.role).toBe('ADMIN');
    });

    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const request = createMockRequest({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Mock json() to throw error
      request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'BAD_REQUEST',
        message: '请求格式错误',
      });
    });
  });
});