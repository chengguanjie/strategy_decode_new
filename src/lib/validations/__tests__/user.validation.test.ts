import {
  validateLoginRequest,
  validateRegisterRequest,
  validateCreateUserRequest,
  validateUpdateUserRequest,
} from '../user.validation';

describe('User Validation', () => {
  describe('validateLoginRequest', () => {
    it('should validate valid login request', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = validateLoginRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123!',
      };

      const result = validateLoginRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('email');
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'Password123!',
      };

      const result = validateLoginRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('email');
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = validateLoginRequest(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('password');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };

      const result = validateLoginRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('password');
    });

    it('should handle email with spaces', () => {
      const dataWithSpaces = {
        email: '  test@example.com  ',
        password: 'Password123!',
      };

      const result = validateLoginRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });

  describe('validateRegisterRequest', () => {
    it('should validate valid register request', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        name: 'New User',
        enterpriseCode: 'ENT001',
      };

      const result = validateRegisterRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject weak password patterns', () => {
      const weakPasswords = [
        { password: 'nouppercas3!', expectedIssue: 'uppercase' },
        { password: 'NOLOWERCASE3!', expectedIssue: 'lowercase' },
        { password: 'NoNumbers!', expectedIssue: 'number' },
        { password: 'NoSpecialChar1', expectedIssue: 'special' },
        { password: 'Short1!', expectedIssue: 'characters' },
      ];

      weakPasswords.forEach(({ password }) => {
        const data = {
          email: 'test@example.com',
          password,
          name: 'Test User',
          enterpriseCode: 'ENT001',
        };

        const result = validateRegisterRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('password');
      });
    });

    it('should reject missing name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        enterpriseCode: 'ENT001',
      };

      const result = validateRegisterRequest(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('should reject empty enterprise code', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        enterpriseCode: '',
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('enterpriseCode');
    });

    it('should handle name with extra spaces', () => {
      const dataWithSpaces = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '  Test   User  ',
        enterpriseCode: 'ENT001',
      };

      const result = validateRegisterRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test   User');
    });

    it('should validate email domain', () => {
      const invalidEmails = [
        'test@',
        '@example.com',
        'test@.com',
        'test@example.',
        'test..test@example.com',
      ];

      invalidEmails.forEach(email => {
        const data = {
          email,
          password: 'Password123!',
          name: 'Test User',
          enterpriseCode: 'ENT001',
        };

        const result = validateRegisterRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('email');
      });
    });
  });

  describe('validateCreateUserRequest', () => {
    it('should validate valid create user request', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        name: 'New User',
        role: 'EMPLOYEE' as const,
        departmentId: 'dept-123',
        position: 'Developer',
      };

      const result = validateCreateUserRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should validate with minimal fields', () => {
      const minimalData = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        name: 'New User',
      };

      const result = validateCreateUserRequest(minimalData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...minimalData,
        role: 'EMPLOYEE', // Default role
      });
    });

    it('should validate role enum', () => {
      const validRoles = ['EMPLOYEE', 'MANAGER', 'ENTERPRISE_ADMIN', 'SYSTEM_ADMIN'];

      validRoles.forEach(role => {
        const data = {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
          role: role as any,
        };

        const result = validateCreateUserRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.role).toBe(role);
      });
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        role: 'INVALID_ROLE',
      };

      const result = validateCreateUserRequest(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('role');
    });

    it('should validate optional fields', () => {
      const dataWithOptionals = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        position: '',
        departmentId: null,
      };

      const result = validateCreateUserRequest(dataWithOptionals as any);
      expect(result.success).toBe(true);
      expect(result.data?.position).toBeUndefined();
      expect(result.data?.departmentId).toBeUndefined();
    });
  });

  describe('validateUpdateUserRequest', () => {
    it('should validate valid update request', () => {
      const validData = {
        name: 'Updated Name',
        position: 'Senior Developer',
        departmentId: 'dept-456',
        role: 'MANAGER' as const,
      };

      const result = validateUpdateUserRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: 'Only Name Updated',
      };

      const result = validateUpdateUserRequest(partialData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialData);
    });

    it('should validate password if provided', () => {
      const dataWithPassword = {
        password: 'NewPassword123!',
        name: 'Updated Name',
      };

      const result = validateUpdateUserRequest(dataWithPassword);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dataWithPassword);
    });

    it('should reject weak password in update', () => {
      const dataWithWeakPassword = {
        password: 'weak',
      };

      const result = validateUpdateUserRequest(dataWithWeakPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('password');
    });

    it('should allow empty update object', () => {
      const emptyData = {};

      const result = validateUpdateUserRequest(emptyData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle null values properly', () => {
      const dataWithNulls = {
        position: null,
        departmentId: null,
      };

      const result = validateUpdateUserRequest(dataWithNulls as any);
      expect(result.success).toBe(true);
      expect(result.data?.position).toBeUndefined();
      expect(result.data?.departmentId).toBeUndefined();
    });

    it('should not allow email update', () => {
      const dataWithEmail = {
        email: 'newemail@example.com',
        name: 'Test User',
      };

      const result = validateUpdateUserRequest(dataWithEmail as any);
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('email');
    });

    it('should validate role if provided', () => {
      const dataWithInvalidRole = {
        role: 'SUPER_ADMIN',
      };

      const result = validateUpdateUserRequest(dataWithInvalidRole as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('role');
    });

    it('should trim string fields', () => {
      const dataWithSpaces = {
        name: '  Trimmed Name  ',
        position: '  Senior Dev  ',
      };

      const result = validateUpdateUserRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Trimmed Name');
      expect(result.data?.position).toBe('Senior Dev');
    });
  });
});