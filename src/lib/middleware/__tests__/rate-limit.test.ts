import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, rateLimiters, withRateLimit } from '../rate-limit';
import { createMockRequest } from '@/test-utils';

// Mock the NextResponse to work in test environment
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((data: any, init?: ResponseInit) => ({
        status: init?.status || 200,
        headers: new Headers(init?.headers || {}),
        json: async () => data,
      })),
    },
  };
});

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limit store between tests
    const store = require('../rate-limit').store;
    Object.keys(store).forEach(key => delete store[key]);
  });

  describe('createRateLimiter', () => {
    it('should allow requests within the rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
      });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        const response = await limiter(request as any);
        expect(response).toBeNull();
      }
    });

    it('should block requests exceeding the rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 3,
        message: 'Too many requests',
      });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First 3 requests should pass
      for (let i = 0; i < 3; i++) {
        const response = await limiter(request as any);
        expect(response).toBeNull();
      }

      // 4th request should be blocked
      const response = await limiter(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);

      const data = await response?.json();
      expect(data?.success).toBe(false);
      expect(data?.error?.code).toBe('RATE_LIMIT');
      expect(data?.error?.message).toBe('Too many requests');
    });

    it('should use different keys for different IPs', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 2,
      });

      const request1 = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const request2 = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // Each IP should have its own limit
      for (let i = 0; i < 2; i++) {
        const response1 = await limiter(request1 as any);
        const response2 = await limiter(request2 as any);
        expect(response1).toBeNull();
        expect(response2).toBeNull();
      }

      // Both should be rate limited now
      const response1 = await limiter(request1 as any);
      const response2 = await limiter(request2 as any);
      expect(response1).not.toBeNull();
      expect(response2).not.toBeNull();
    });

    it('should skip rate limiting when skip function returns true', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        skip: (req) => req.headers.get('x-skip-limit') === 'true',
      });

      const request = createMockRequest({
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-skip-limit': 'true',
        },
      });

      // Should not be limited even after multiple requests
      for (let i = 0; i < 5; i++) {
        const response = await limiter(request as any);
        expect(response).toBeNull();
      }
    });

    it('should include rate limit headers in response', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
      });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Make requests up to the limit
      for (let i = 0; i < 6; i++) {
        const response = await limiter(request as any);

        if (i === 5) {
          // Last request should be blocked
          expect(response).not.toBeNull();
          expect(response?.headers.get('X-RateLimit-Limit')).toBe('5');
          expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0');
          expect(response?.headers.get('Retry-After')).toBeDefined();
        }
      }
    });
  });

  describe('predefined rate limiters', () => {
    it('should have standard rate limiter with correct config', async () => {
      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Standard limiter allows 100 requests per 15 minutes
      for (let i = 0; i < 100; i++) {
        const response = await rateLimiters.standard(request as any);
        expect(response).toBeNull();
      }

      // 101st request should be blocked
      const response = await rateLimiters.standard(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });

    it('should have strict rate limiter for sensitive operations', async () => {
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/login',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Strict limiter allows only 5 requests per 15 minutes
      for (let i = 0; i < 5; i++) {
        const response = await rateLimiters.strict(request as any);
        expect(response).toBeNull();
      }

      // 6th request should be blocked
      const response = await rateLimiters.strict(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });

    it('should have upload rate limiter for file uploads', async () => {
      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Upload limiter allows 20 requests per hour
      for (let i = 0; i < 20; i++) {
        const response = await rateLimiters.upload(request as any);
        expect(response).toBeNull();
      }

      // 21st request should be blocked
      const response = await rateLimiters.upload(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });
  });

  describe('withRateLimit wrapper', () => {
    it('should wrap API handler with rate limiting', async () => {
      const mockHandler = jest.fn(async (req: NextRequest) => {
        return NextResponse.json({ success: true });
      });

      const protectedHandler = withRateLimit(mockHandler, {
        windowMs: 60000,
        max: 2,
      });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First 2 requests should succeed
      for (let i = 0; i < 2; i++) {
        const response = await protectedHandler(request as any);
        expect(mockHandler).toHaveBeenCalled();
        const data = await response.json();
        expect(data.success).toBe(true);
      }

      // Reset mock count
      mockHandler.mockClear();

      // 3rd request should be rate limited
      const response = await protectedHandler(request as any);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });
  });

  describe('custom key generators', () => {
    it('should support custom key generation', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 2,
        keyGenerator: (req) => {
          const userId = req.headers.get('x-user-id') || 'anonymous';
          return `user:${userId}`;
        },
      });

      const request1 = createMockRequest({
        headers: { 'x-user-id': 'user1' },
      });

      const request2 = createMockRequest({
        headers: { 'x-user-id': 'user2' },
      });

      // Each user should have their own limit
      for (let i = 0; i < 2; i++) {
        const response1 = await limiter(request1 as any);
        const response2 = await limiter(request2 as any);
        expect(response1).toBeNull();
        expect(response2).toBeNull();
      }

      // Both users should be at their limit
      const response1 = await limiter(request1 as any);
      const response2 = await limiter(request2 as any);
      expect(response1).not.toBeNull();
      expect(response2).not.toBeNull();
    });
  });

  describe('store cleanup', () => {
    it('should clean up expired entries', async () => {
      const store = require('../rate-limit').store;
      const now = Date.now();

      // Add some expired entries
      store['expired1'] = { count: 5, resetTime: now - 1000 };
      store['expired2'] = { count: 3, resetTime: now - 2000 };
      store['valid'] = { count: 1, resetTime: now + 10000 };

      // Trigger cleanup
      const cleanupStore = require('../rate-limit').cleanupStore;
      cleanupStore();

      // Only valid entry should remain
      expect(Object.keys(store)).toEqual(['valid']);
    });
  });
});