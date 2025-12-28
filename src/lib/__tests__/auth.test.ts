/**
 * Unit Tests: 认证模块 (Authentication Module)
 * 
 * Tests for hashPassword, comparePassword, generateToken, and verifyToken functions.
 * 
 * **Validates: Requirements 7.2**
 * 
 * Feature: project-diagnosis-improvement
 */

import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  JwtPayload,
} from '../auth';

describe('Authentication Module Unit Tests', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // bcrypt generates different hashes due to random salt
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters in password', async () => {
      const password = '密码测试123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should handle unicode characters correctly', async () => {
      const password = '密码测试123';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });
  });

  describe('generateToken', () => {
    const validPayload: JwtPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      enterpriseId: 'enterprise-456',
    };

    it('should generate a valid JWT token', () => {
      const token = generateToken(validPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1: JwtPayload = { ...validPayload, userId: 'user-1' };
      const payload2: JwtPayload = { ...validPayload, userId: 'user-2' };
      
      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);
      
      expect(token1).not.toBe(token2);
    });

    it('should handle payload without enterpriseId', () => {
      const payload: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
      
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should handle different roles', () => {
      const roles = ['admin', 'enterprise_admin', 'department_manager', 'employee'];
      
      roles.forEach(role => {
        const payload: JwtPayload = { ...validPayload, role };
        const token = generateToken(payload);
        expect(token).toBeDefined();
      });
    });
  });

  describe('verifyToken', () => {
    const validPayload: JwtPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      enterpriseId: 'enterprise-456',
    };

    it('should verify and decode a valid token', () => {
      const token = generateToken(validPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(validPayload.userId);
      expect(decoded?.email).toBe(validPayload.email);
      expect(decoded?.role).toBe(validPayload.role);
      expect(decoded?.enterpriseId).toBe(validPayload.enterpriseId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedTokens = [
        'not-a-jwt',
        'only.two.parts.here.extra',
        '...',
        'abc',
      ];
      
      malformedTokens.forEach(token => {
        const decoded = verifyToken(token);
        expect(decoded).toBeNull();
      });
    });

    it('should preserve payload without enterpriseId', () => {
      const payload: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
      
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.enterpriseId).toBeUndefined();
    });
  });

  describe('Token Round-Trip', () => {
    it('should correctly encode and decode payload', () => {
      const payload: JwtPayload = {
        userId: 'test-user-id-12345',
        email: 'roundtrip@test.com',
        role: 'enterprise_admin',
        enterpriseId: 'enterprise-xyz-789',
      };
      
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
      expect(decoded?.enterpriseId).toBe(payload.enterpriseId);
    });
  });
});
