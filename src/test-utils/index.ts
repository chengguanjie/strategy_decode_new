import { NextRequest, NextResponse } from 'next/server';
import { JwtPayload } from '@/lib/auth';
import { User, Enterprise, Department } from '@prisma/client';

/**
 * Test utilities for unit and integration tests
 */

/**
 * Create a mock NextRequest
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    params = {},
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const headerBag = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headerBag.set(key, value);
  });

  const cookieStore = new Map<string, string>();

  const request: any = {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    headers: headerBag,
    cookies: {
      get: (name: string) => {
        const value = cookieStore.get(name);
        return value === undefined ? undefined : { name, value };
      },
      set: (name: string, value: string) => {
        cookieStore.set(name, value);
      },
      delete: (name: string) => {
        cookieStore.delete(name);
      },
    },
    json: async () => body || {},
    text: async () => (body ? JSON.stringify(body) : ''),
    params,
  };

  return request as NextRequest;
}

/**
 * Create a mock NextResponse for testing
 */
export function createMockResponse(data: any, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create mock JWT payload
 */
export function createMockJwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'EMPLOYEE',
    enterpriseId: 'test-enterprise-id',
    ...overrides,
  };
}

/**
 * Create mock user
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    role: 'EMPLOYEE',
    avatar: null,
    position: null,
    enterpriseId: 'test-enterprise-id',
    departmentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock enterprise
 */
export function createMockEnterprise(overrides: Partial<Enterprise> = {}): Enterprise {
  return {
    id: 'test-enterprise-id',
    name: 'Test Enterprise',
    code: 'TEST001',
    logo: null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock department
 */
export function createMockDepartment(overrides: Partial<Department> = {}): Department {
  return {
    id: 'test-department-id',
    name: 'Test Department',
    leader: null,
    parentId: null,
    enterpriseId: 'test-enterprise-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock Prisma client for testing
 */
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    enterprise: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    strategy: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    strategyTableData: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(createMockPrismaClient())),
  };
}

/**
 * Assert API success response
 */
export function assertSuccessResponse(response: NextResponse, expectedData?: any) {
  expect(response.status).toBe(200);

  const data = response.json();
  expect(data).toHaveProperty('success', true);

  if (expectedData !== undefined) {
    expect(data).toHaveProperty('data', expectedData);
  }
}

/**
 * Assert API error response
 */
export function assertErrorResponse(
  response: NextResponse,
  expectedStatus: number,
  expectedCode?: string,
  expectedMessage?: string
) {
  expect(response.status).toBe(expectedStatus);

  const data = response.json();
  expect(data).toHaveProperty('success', false);
  expect(data).toHaveProperty('error');

  if (expectedCode) {
    expect(data.error).toHaveProperty('code', expectedCode);
  }

  if (expectedMessage) {
    expect(data.error).toHaveProperty('message', expectedMessage);
  }
}

/**
 * Wait for async operations
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods for tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const mocks = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };

  const restore = () => {
    Object.entries(mocks).forEach(([method, mock]) => {
      mock.mockRestore();
    });
  };

  const getMessages = (method: keyof typeof mocks) => {
    return mocks[method].mock.calls.map(call => call.join(' '));
  };

  return { mocks, restore, getMessages };
}

/**
 * Create headers with authentication
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create headers with CSRF token
 */
export function createCsrfHeaders(csrfToken: string): Record<string, string> {
  return {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  };
}
