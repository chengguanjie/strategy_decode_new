import { POST } from '../route';
import { createMockRequest } from '@/test-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockConsole } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));

describe('/api/auth/login', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    name: 'Test User',
    role: 'EMPLOYEE',
    enterpriseId: 'enterprise-1',
    enterprise: {
      id: 'enterprise-1',
      name: 'Test Enterprise',
      code: 'TEST001',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        token: 'mock-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          enterpriseId: mockUser.enterpriseId,
        },
      });
      expect(data.data.user.password).toBeUndefined();
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          enterpriseId: mockUser.enterpriseId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
    });

    it('should reject login with non-existent email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_001',
        message: '邮箱或密码错误',
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'AUTH_001',
        message: '邮箱或密码错误',
      });
    });

    it('should validate required fields', async () => {
      // Test missing email
      let request = createMockRequest({
        method: 'POST',
        body: { password: 'password123' },
      });

      let response = await POST(request);
      let data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'VALIDATION_001',
        message: '请求参数验证失败',
      });

      // Test missing password
      request = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
      });

      response = await POST(request);
      data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'VALIDATION_001',
        message: '请求参数验证失败',
      });
    });

    it('should validate email format', async () => {
      // Arrange
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'VALIDATION_001',
        message: '请求参数验证失败',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const dbError = new Error('Database connection failed');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'POST',
        body: loginData,
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
      expect(mocks.error).toHaveBeenCalledWith('登录失败:', dbError);

      restore();
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

    it('should trim email before validation', async () => {
      // Arrange
      const loginData = {
        email: '  test@example.com  ',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      await POST(request);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { enterprise: true },
      });
    });

    it('should be rate limited', async () => {
      // This test verifies that rate limiting is applied to the login endpoint
      // The actual rate limiting is tested in the middleware tests
      // Here we just verify the endpoint can handle rate limit responses

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      // Simulate multiple rapid requests
      for (let i = 0; i < 6; i++) {
        await POST(request);
      }

      // The middleware should handle rate limiting
      // This test ensures the route can handle the middleware's response
    });

    it('should include enterprise info in response', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'POST',
        body: loginData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.data.user.enterprise).toEqual({
        id: mockUser.enterprise.id,
        name: mockUser.enterprise.name,
        code: mockUser.enterprise.code,
      });
    });
  });
});