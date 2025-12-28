import { GET, POST } from '../route';
import { createMockRequest, createMockEnterprise } from '@/test-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { mockConsole } from '@/test-utils';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    enterprise: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => '$2a$10$hashedpassword'),
}));

describe('/api/enterprises', () => {
  const mockEnterprises = [
    {
      id: 'enterprise-1',
      name: 'Test Enterprise 1',
      code: 'TEST001',
      status: 'ACTIVE',
      logo: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: { users: 5 },
    },
    {
      id: 'enterprise-2',
      name: 'Test Enterprise 2',
      code: 'TEST002',
      status: 'INACTIVE',
      logo: null,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      _count: { users: 3 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return list of enterprises with user counts', async () => {
      // Arrange
      (prisma.enterprise.findMany as jest.Mock).mockResolvedValue(mockEnterprises);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([
        {
          id: 'enterprise-1',
          name: 'Test Enterprise 1',
          code: 'TEST001',
          status: 'active',
          users: 5,
          createdAt: '2024-01-01',
        },
        {
          id: 'enterprise-2',
          name: 'Test Enterprise 2',
          code: 'TEST002',
          status: 'inactive',
          users: 3,
          createdAt: '2024-01-02',
        },
      ]);

      expect(prisma.enterprise.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty enterprise list', async () => {
      // Arrange
      (prisma.enterprise.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (prisma.enterprise.findMany as jest.Mock).mockRejectedValue(dbError);

      const { mocks, restore } = mockConsole();

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ENT_LIST_FAILED');
      expect(mocks.error).toHaveBeenCalledWith('Error fetching enterprises:', dbError);

      restore();
    });

    it('should format dates correctly', async () => {
      // Arrange
      const enterpriseWithTime = [{
        ...mockEnterprises[0],
        createdAt: new Date('2024-01-15T14:30:00.000Z'),
      }];
      (prisma.enterprise.findMany as jest.Mock).mockResolvedValue(enterpriseWithTime);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.data[0].createdAt).toBe('2024-01-15');
    });
  });

  describe('POST', () => {
    it('should create enterprise without admin user', async () => {
      // Arrange
      const createData = {
        name: 'New Enterprise',
        code: 'NEW001',
        status: 'active',
      };

      const createdEnterprise = {
        id: 'enterprise-new',
        name: createData.name,
        code: createData.code,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const mockTx = {
          enterprise: {
            create: jest.fn().mockResolvedValue(createdEnterprise),
          },
          user: {
            create: jest.fn(),
          },
        };
        return fn(mockTx);
      });

      const request = createMockRequest({
        method: 'POST',
        body: createData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'enterprise-new',
        name: createData.name,
        code: createData.code,
        status: 'ACTIVE',
      });
    });

    it('should create enterprise with admin user', async () => {
      // Arrange
      const createData = {
        name: 'New Enterprise',
        code: 'NEW001',
        status: 'active',
        adminAccount: 'admin@newenterprise.com',
        initialPassword: 'AdminPass123!',
      };

      const createdEnterprise = {
        id: 'enterprise-new',
        name: createData.name,
        code: createData.code,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdUser = {
        id: 'user-admin',
        email: createData.adminAccount,
        name: `${createData.name}管理员`,
        role: 'ENTERPRISE_ADMIN',
        enterpriseId: createdEnterprise.id,
      };

      let txEnterprise: any;
      let txUser: any;

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const mockTx = {
          enterprise: {
            create: jest.fn().mockResolvedValue(createdEnterprise),
          },
          user: {
            create: jest.fn().mockResolvedValue(createdUser),
          },
        };
        const result = await fn(mockTx);
        txEnterprise = mockTx.enterprise.create;
        txUser = mockTx.user.create;
        return result;
      });

      const request = createMockRequest({
        method: 'POST',
        body: createData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('AdminPass123!', 10);

      expect(txEnterprise).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          code: createData.code,
          status: 'ACTIVE',
        },
      });

      expect(txUser).toHaveBeenCalledWith({
        data: {
          email: createData.adminAccount,
          name: `${createData.name}管理员`,
          password: '$2a$10$hashedpassword',
          role: 'ENTERPRISE_ADMIN',
          enterpriseId: createdEnterprise.id,
        },
      });
    });

    it('should handle invalid status value', async () => {
      // Arrange
      const createData = {
        name: 'New Enterprise',
        code: 'NEW001',
        status: 'invalid_status',
      };

      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Invalid enum value')
      );

      const request = createMockRequest({
        method: 'POST',
        body: createData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ENT_CREATE_FAILED');
    });

    it('should handle transaction rollback on user creation failure', async () => {
      // Arrange
      const createData = {
        name: 'New Enterprise',
        code: 'NEW001',
        status: 'active',
        adminAccount: 'admin@newenterprise.com',
        initialPassword: 'AdminPass123!',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const mockTx = {
          enterprise: {
            create: jest.fn().mockResolvedValue({
              id: 'enterprise-new',
              name: createData.name,
              code: createData.code,
              status: 'ACTIVE',
            }),
          },
          user: {
            create: jest.fn().mockRejectedValue(new Error('User creation failed')),
          },
        };
        return fn(mockTx);
      });

      const { mocks, restore } = mockConsole();
      const request = createMockRequest({
        method: 'POST',
        body: createData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ENT_CREATE_FAILED');
      expect(mocks.error).toHaveBeenCalled();

      restore();
    });

    it('should handle missing required fields', async () => {
      // Test missing name
      let request = createMockRequest({
        method: 'POST',
        body: {
          code: 'NEW001',
          status: 'active',
        },
      });

      let response = await POST(request);
      expect(response.status).toBe(500);

      // Test missing code
      request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New Enterprise',
          status: 'active',
        },
      });

      response = await POST(request);
      expect(response.status).toBe(500);

      // Test missing status
      request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New Enterprise',
          code: 'NEW001',
        },
      });

      response = await POST(request);
      expect(response.status).toBe(500);
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
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ENT_CREATE_FAILED');
    });

    it('should convert status to uppercase', async () => {
      // Arrange
      const createData = {
        name: 'New Enterprise',
        code: 'NEW001',
        status: 'active', // lowercase
      };

      let capturedData: any;

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const mockTx = {
          enterprise: {
            create: jest.fn().mockImplementation((args) => {
              capturedData = args.data;
              return Promise.resolve({
                id: 'enterprise-new',
                ...args.data,
              });
            }),
          },
          user: {
            create: jest.fn(),
          },
        };
        return fn(mockTx);
      });

      const request = createMockRequest({
        method: 'POST',
        body: createData,
      });

      // Act
      await POST(request);

      // Assert
      expect(capturedData.status).toBe('ACTIVE');
    });
  });
});