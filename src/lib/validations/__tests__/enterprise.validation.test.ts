import {
  validateCreateEnterpriseRequest,
  validateUpdateEnterpriseRequest,
  validateEnterpriseCode,
} from '../enterprise.validation';

describe('Enterprise Validation', () => {
  describe('validateCreateEnterpriseRequest', () => {
    it('should validate valid enterprise creation request', () => {
      const validData = {
        name: '测试企业',
        code: 'TEST001',
        description: '这是一个测试企业',
        contactName: '张三',
        contactPhone: '13800138000',
        contactEmail: 'contact@test.com',
        address: '北京市朝阳区测试路1号',
      };

      const result = validateCreateEnterpriseRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should validate with minimal required fields', () => {
      const minimalData = {
        name: '最小测试企业',
        code: 'MIN001',
      };

      const result = validateCreateEnterpriseRequest(minimalData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalData);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        code: 'TEST001',
      };

      const result = validateCreateEnterpriseRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      const invalidData = {
        name: longName,
        code: 'TEST001',
      };

      const result = validateCreateEnterpriseRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('should validate enterprise code format', () => {
      const invalidCodes = [
        '',              // Empty
        'TEST',          // Too short
        'TEST@001',      // Special characters
        'test001',       // Lowercase
        'TEST-001',      // Hyphen
        'TEST 001',      // Space
        '测试001',       // Chinese characters
        'TOOLONGCODE123', // Too long
      ];

      invalidCodes.forEach(code => {
        const data = {
          name: 'Test Enterprise',
          code,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('code');
      });
    });

    it('should validate valid enterprise codes', () => {
      const validCodes = [
        'TEST001',
        'ENT2024',
        'ABC123',
        'XYZ999',
        'CORP01',
      ];

      validCodes.forEach(code => {
        const data = {
          name: 'Test Enterprise',
          code,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.code).toBe(code);
      });
    });

    it('should validate contact phone format', () => {
      const validPhones = [
        '13800138000',
        '18612345678',
        '15900000000',
      ];

      validPhones.forEach(phone => {
        const data = {
          name: 'Test Enterprise',
          code: 'TEST001',
          contactPhone: phone,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.contactPhone).toBe(phone);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '12345678901',    // Wrong prefix
        '138001380',      // Too short
        '138001380000',   // Too long
        '1380013800a',    // Contains letter
        '138-0013-8000',  // Contains hyphens
      ];

      invalidPhones.forEach(phone => {
        const data = {
          name: 'Test Enterprise',
          code: 'TEST001',
          contactPhone: phone,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('contactPhone');
      });
    });

    it('should validate contact email', () => {
      const validData = {
        name: 'Test Enterprise',
        code: 'TEST001',
        contactEmail: 'contact@example.com',
      };

      const result = validateCreateEnterpriseRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data?.contactEmail).toBe('contact@example.com');
    });

    it('should reject invalid contact email', () => {
      const invalidData = {
        name: 'Test Enterprise',
        code: 'TEST001',
        contactEmail: 'not-an-email',
      };

      const result = validateCreateEnterpriseRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('contactEmail');
    });

    it('should handle optional logo URL', () => {
      const validUrls = [
        'https://example.com/logo.png',
        'http://test.com/images/logo.jpg',
        'https://cdn.example.com/assets/logo.svg',
      ];

      validUrls.forEach(logo => {
        const data = {
          name: 'Test Enterprise',
          code: 'TEST001',
          logo,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.logo).toBe(logo);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com/logo.png',
        'javascript:alert(1)',
        '../images/logo.png',
      ];

      invalidUrls.forEach(logo => {
        const data = {
          name: 'Test Enterprise',
          code: 'TEST001',
          logo,
        };

        const result = validateCreateEnterpriseRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('logo');
      });
    });

    it('should trim string fields', () => {
      const dataWithSpaces = {
        name: '  测试企业  ',
        code: '  TEST001  ',
        description: '  这是描述  ',
        contactName: '  张三  ',
        address: '  测试地址  ',
      };

      const result = validateCreateEnterpriseRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('测试企业');
      expect(result.data?.code).toBe('TEST001');
      expect(result.data?.description).toBe('这是描述');
      expect(result.data?.contactName).toBe('张三');
      expect(result.data?.address).toBe('测试地址');
    });
  });

  describe('validateUpdateEnterpriseRequest', () => {
    it('should validate valid update request', () => {
      const validData = {
        name: '更新后的企业名称',
        description: '更新后的描述',
        status: 'ACTIVE' as const,
      };

      const result = validateUpdateEnterpriseRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: '只更新名称',
      };

      const result = validateUpdateEnterpriseRequest(partialData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialData);
    });

    it('should validate status enum', () => {
      const validStatuses = ['ACTIVE', 'INACTIVE'];

      validStatuses.forEach(status => {
        const data = {
          status: status as any,
        };

        const result = validateUpdateEnterpriseRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.status).toBe(status);
      });
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'SUSPENDED',
      };

      const result = validateUpdateEnterpriseRequest(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('status');
    });

    it('should not allow code update', () => {
      const dataWithCode = {
        name: '更新名称',
        code: 'NEWCODE001',
      };

      const result = validateUpdateEnterpriseRequest(dataWithCode as any);
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('code');
    });

    it('should allow empty update', () => {
      const emptyData = {};

      const result = validateUpdateEnterpriseRequest(emptyData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle null values', () => {
      const dataWithNulls = {
        description: null,
        logo: null,
        contactName: null,
      };

      const result = validateUpdateEnterpriseRequest(dataWithNulls as any);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
      expect(result.data?.logo).toBeUndefined();
      expect(result.data?.contactName).toBeUndefined();
    });

    it('should validate contact updates', () => {
      const validContactUpdate = {
        contactName: '李四',
        contactPhone: '13900139000',
        contactEmail: 'newcontact@example.com',
      };

      const result = validateUpdateEnterpriseRequest(validContactUpdate);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validContactUpdate);
    });
  });

  describe('validateEnterpriseCode', () => {
    it('should validate correct format', () => {
      const validCodes = ['TEST001', 'ENT2024', 'ABC123'];

      validCodes.forEach(code => {
        const result = validateEnterpriseCode(code);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid format', () => {
      const invalidCodes = [
        'test001',      // Lowercase
        'TEST-001',     // Contains hyphen
        'TEST',         // Too short
        'TOOLONGCODE',  // Too long
        'TEST@001',     // Special character
        '',             // Empty
      ];

      invalidCodes.forEach(code => {
        const result = validateEnterpriseCode(code);
        expect(result).toBe(false);
      });
    });
  });
});