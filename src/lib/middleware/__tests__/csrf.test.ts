import { NextRequest, NextResponse } from 'next/server';
import {
  CsrfTokenManager,
  createCsrfProtection,
  withCsrfProtection,
  addCsrfToken,
  createDoubleSubmitCsrfProtection,
} from '../csrf';
import { createMockRequest } from '@/test-utils';
import { securityConfig } from '@/config/security';

describe('CSRF Protection', () => {
  describe('CsrfTokenManager', () => {
    it('should generate random tokens', () => {
      const token1 = CsrfTokenManager.generateToken();
      const token2 = CsrfTokenManager.generateToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes as hex
    });

    it('should hash tokens consistently', () => {
      const token = 'test-token';
      const secret = 'test-secret';

      const hash1 = CsrfTokenManager.hashToken(token, secret);
      const hash2 = CsrfTokenManager.hashToken(token, secret);

      expect(hash1).toBe(hash2);
    });

    it('should verify valid tokens', () => {
      const token = 'test-token';
      const secret = 'test-secret';
      const hashedToken = CsrfTokenManager.hashToken(token, secret);

      const isValid = CsrfTokenManager.verifyToken(token, hashedToken, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const token = 'test-token';
      const wrongToken = 'wrong-token';
      const secret = 'test-secret';
      const hashedToken = CsrfTokenManager.hashToken(token, secret);

      const isValid = CsrfTokenManager.verifyToken(wrongToken, hashedToken, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('createCsrfProtection', () => {
    let csrfProtection: ReturnType<typeof createCsrfProtection>;

    beforeEach(() => {
      csrfProtection = createCsrfProtection();
    });

    it('should skip CSRF check for safe methods', async () => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

      for (const method of safeMethods) {
        const request = createMockRequest({ method });
        const response = await csrfProtection(request as any);
        expect(response).toBeNull();
      }
    });

    it('should skip CSRF check for excluded paths', async () => {
      const protection = createCsrfProtection({
        excludePaths: ['/api/public', '/api/webhook'],
      });

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/public/data',
      });

      const response = await protection(request as any);
      expect(response).toBeNull();
    });

    it('should skip CSRF check for Bearer token requests', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer test-token' },
      });

      const response = await csrfProtection(request as any);
      expect(response).toBeNull();
    });

    it('should require CSRF token for POST requests', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/protected',
      });

      // No cookie, should generate new token
      const response = await csrfProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_004');
      expect(data.error.message).toBe('需要 CSRF Token');
      expect(data.error.details?.token).toBeDefined();
    });

    it('should validate CSRF token from header', async () => {
      const token = CsrfTokenManager.generateToken();
      const hashedToken = CsrfTokenManager.hashToken(token, securityConfig.csrf.secret);

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
      });

      // Mock cookie
      request.cookies.set(securityConfig.csrf.cookieName, hashedToken);

      const response = await csrfProtection(request as any);
      expect(response).toBeNull();
    });

    it('should reject invalid CSRF token', async () => {
      const validToken = CsrfTokenManager.generateToken();
      const invalidToken = 'invalid-token';
      const hashedToken = CsrfTokenManager.hashToken(validToken, securityConfig.csrf.secret);

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': invalidToken },
      });

      // Mock cookie
      request.cookies.set(securityConfig.csrf.cookieName, hashedToken);

      const response = await csrfProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_002');
    });

    it('should reject request without CSRF header', async () => {
      const token = CsrfTokenManager.generateToken();
      const hashedToken = CsrfTokenManager.hashToken(token, securityConfig.csrf.secret);

      const request = createMockRequest({
        method: 'POST',
      });

      // Mock cookie but no header
      request.cookies.set(securityConfig.csrf.cookieName, hashedToken);

      const response = await csrfProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_001');
      expect(data.error.message).toBe('CSRF Token 缺失');
    });
  });

  describe('addCsrfToken', () => {
    it('should add CSRF token to response', () => {
      const response = NextResponse.json({ success: true });
      const updatedResponse = addCsrfToken(response);

      // Should set cookie
      const cookies = updatedResponse.headers.get('set-cookie');
      expect(cookies).toContain(securityConfig.csrf.cookieName);

      // Should set header
      const csrfHeader = updatedResponse.headers.get('X-CSRF-Token');
      expect(csrfHeader).toBeDefined();
      expect(csrfHeader?.length).toBe(64);
    });
  });

  describe('withCsrfProtection wrapper', () => {
    it('should wrap handler with CSRF protection', async () => {
      const mockHandler = jest.fn(async (req: NextRequest) => {
        return NextResponse.json({ success: true });
      });

      const protectedHandler = withCsrfProtection(mockHandler);

      // Test GET request (should pass)
      const getRequest = createMockRequest({ method: 'GET' });
      await protectedHandler(getRequest as any);
      expect(mockHandler).toHaveBeenCalled();

      // Reset mock
      mockHandler.mockClear();

      // Test POST without token (should fail)
      const postRequest = createMockRequest({ method: 'POST' });
      const response = await protectedHandler(postRequest as any);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });

  describe('createDoubleSubmitCsrfProtection', () => {
    let doubleSubmitProtection: ReturnType<typeof createDoubleSubmitCsrfProtection>;

    beforeEach(() => {
      doubleSubmitProtection = createDoubleSubmitCsrfProtection();
    });

    it('should validate matching cookie and header tokens', async () => {
      const token = 'matching-token';

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
      });

      request.cookies.set(securityConfig.csrf.cookieName, token);

      const response = await doubleSubmitProtection(request as any);
      expect(response).toBeNull();
    });

    it('should reject mismatched tokens', async () => {
      const cookieToken = 'cookie-token';
      const headerToken = 'header-token';

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': headerToken },
      });

      request.cookies.set(securityConfig.csrf.cookieName, cookieToken);

      const response = await doubleSubmitProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_006');
    });

    it('should reject missing cookie', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'token' },
      });

      const response = await doubleSubmitProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_005');
    });

    it('should reject missing header', async () => {
      const request = createMockRequest({
        method: 'POST',
      });

      request.cookies.set(securityConfig.csrf.cookieName, 'token');

      const response = await doubleSubmitProtection(request as any);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.error.code).toBe('CSRF_005');
    });
  });

  describe('Custom options', () => {
    it('should use custom cookie name', async () => {
      const customCookieName = 'custom-csrf-token';
      const protection = createCsrfProtection({
        cookieName: customCookieName,
      });

      const token = CsrfTokenManager.generateToken();
      const hashedToken = CsrfTokenManager.hashToken(token, securityConfig.csrf.secret);

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
      });

      request.cookies.set(customCookieName, hashedToken);

      const response = await protection(request as any);
      expect(response).toBeNull();
    });

    it('should use custom header name', async () => {
      const customHeaderName = 'X-Custom-CSRF';
      const protection = createCsrfProtection({
        headerName: customHeaderName,
      });

      const token = CsrfTokenManager.generateToken();
      const hashedToken = CsrfTokenManager.hashToken(token, securityConfig.csrf.secret);

      const request = createMockRequest({
        method: 'POST',
        headers: { [customHeaderName]: token },
      });

      request.cookies.set(securityConfig.csrf.cookieName, hashedToken);

      const response = await protection(request as any);
      expect(response).toBeNull();
    });

    it('should use custom secret', async () => {
      const customSecret = 'custom-secret-key';
      const protection = createCsrfProtection({
        secret: customSecret,
      });

      const token = CsrfTokenManager.generateToken();
      const hashedToken = CsrfTokenManager.hashToken(token, customSecret);

      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
      });

      request.cookies.set(securityConfig.csrf.cookieName, hashedToken);

      const response = await protection(request as any);
      expect(response).toBeNull();
    });
  });
});
