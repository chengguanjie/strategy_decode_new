// Jest setup file
// Add any global test setup here

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.CSRF_SECRET = 'test-csrf-secret-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
process.env.NODE_ENV = 'test';

// Increase timeout for property-based tests (they run many iterations)
jest.setTimeout(30000);

// Configure fast-check global settings if needed
// Note: fast-check is configured per-test in pbt-config.ts

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => {
      const headers = new Map(Object.entries(init?.headers || {}));
      const response = {
        status: init?.status || 200,
        headers,
        cookies: {
          set: jest.fn((cookie) => {
            const name = typeof cookie === 'string' ? cookie : cookie?.name;
            const value = typeof cookie === 'string' ? '' : cookie?.value;
            const cookieString = name ? `${name}=${value}` : '';
            const existing = headers.get('set-cookie');
            headers.set('set-cookie', existing ? `${existing}, ${cookieString}` : cookieString);
          }),
        },
        json: async () => data,
      };
      return response;
    }),
    redirect: jest.fn((url) => ({
      status: 307,
      headers: new Map([['Location', url.toString()]]),
      cookies: { set: jest.fn() },
    })),
    next: jest.fn(() => ({
      status: 200,
      headers: new Map(),
      cookies: { set: jest.fn() },
    })),
  },
}));

// Global test utilities
global.testUtils = {
  createMockRequest: (options = {}) => ({
    method: 'GET',
    headers: new Map(Object.entries(options.headers || {})),
    url: options.url || 'http://localhost:3000/api/test',
    json: async () => options.body || {},
    text: async () => JSON.stringify(options.body || {}),
    ...options,
  }),

  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'EMPLOYEE',
    ...overrides,
  }),
};
