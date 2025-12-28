import {
  validateCreateDepartmentRequest,
  validateUpdateDepartmentRequest,
  validateDepartmentQueryParams,
  validateDepartmentName,
} from '../department.validation';

describe('Department Validation', () => {
  describe('validateCreateDepartmentRequest', () => {
    it('should validate valid department creation request', () => {
      const validData = {
        name: '技术部',
        leader: '张三',
        parentId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = validateCreateDepartmentRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should validate with minimal required fields', () => {
      const minimalData = {
        name: '市场部',
      };

      const result = validateCreateDepartmentRequest(minimalData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalData);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        leader: '李四',
      };

      const result = validateCreateDepartmentRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('should reject name longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      const invalidData = {
        name: longName,
      };

      const result = validateCreateDepartmentRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('should reject name with special characters', () => {
      const invalidNames = [
        '部门<script>',
        '部门"test"',
        "部门'test'",
        '部门\\test',
        '<div>部门</div>',
      ];

      invalidNames.forEach(name => {
        const data = {
          name,
        };

        const result = validateCreateDepartmentRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('name');
      });
    });

    it('should validate valid department names', () => {
      const validNames = [
        '技术部',
        '市场营销部',
        '人力资源部',
        'IT部门',
        '研发一部',
        '销售部-华东区',
      ];

      validNames.forEach(name => {
        const data = {
          name,
        };

        const result = validateCreateDepartmentRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.name).toBe(name);
      });
    });

    it('should handle leader field', () => {
      const dataWithLeader = {
        name: '财务部',
        leader: '王五',
      };

      const result = validateCreateDepartmentRequest(dataWithLeader);
      expect(result.success).toBe(true);
      expect(result.data?.leader).toBe('王五');
    });

    it('should reject leader with special characters', () => {
      const invalidData = {
        name: '部门',
        leader: '<script>alert(1)</script>',
      };

      const result = validateCreateDepartmentRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('leader');
    });

    it('should handle null leader', () => {
      const dataWithNullLeader = {
        name: '部门',
        leader: null,
      };

      const result = validateCreateDepartmentRequest(dataWithNullLeader as any);
      expect(result.success).toBe(true);
      expect(result.data?.leader).toBeUndefined();
    });

    it('should handle empty leader string', () => {
      const dataWithEmptyLeader = {
        name: '部门',
        leader: '',
      };

      const result = validateCreateDepartmentRequest(dataWithEmptyLeader);
      expect(result.success).toBe(true);
      expect(result.data?.leader).toBeUndefined();
    });

    it('should validate parent ID format', () => {
      const validParentId = '123e4567-e89b-12d3-a456-426614174000';
      const data = {
        name: '子部门',
        parentId: validParentId,
      };

      const result = validateCreateDepartmentRequest(data);
      expect(result.success).toBe(true);
      expect(result.data?.parentId).toBe(validParentId);
    });

    it('should reject invalid UUID for parentId', () => {
      const invalidParentIds = [
        'not-a-uuid',
        '123',
        'xyz-456',
        '123e4567-e89b-12d3-a456',
      ];

      invalidParentIds.forEach(parentId => {
        const data = {
          name: '部门',
          parentId,
        };

        const result = validateCreateDepartmentRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('parentId');
      });
    });

    it('should handle null parentId', () => {
      const dataWithNullParent = {
        name: '顶级部门',
        parentId: null,
      };

      const result = validateCreateDepartmentRequest(dataWithNullParent as any);
      expect(result.success).toBe(true);
      expect(result.data?.parentId).toBeUndefined();
    });

    it('should trim string fields', () => {
      const dataWithSpaces = {
        name: '  技术部  ',
        leader: '  张三  ',
      };

      const result = validateCreateDepartmentRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('技术部');
      expect(result.data?.leader).toBe('张三');
    });
  });

  describe('validateUpdateDepartmentRequest', () => {
    it('should validate valid update request', () => {
      const validData = {
        name: '更新后的部门',
        leader: '新负责人',
      };

      const result = validateUpdateDepartmentRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: '只更新名称',
      };

      const result = validateUpdateDepartmentRequest(partialData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialData);
    });

    it('should allow updating only leader', () => {
      const leaderOnlyData = {
        leader: '新负责人',
      };

      const result = validateUpdateDepartmentRequest(leaderOnlyData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(leaderOnlyData);
    });

    it('should allow updating parentId', () => {
      const newParentId = '123e4567-e89b-12d3-a456-426614174001';
      const data = {
        parentId: newParentId,
      };

      const result = validateUpdateDepartmentRequest(data);
      expect(result.success).toBe(true);
      expect(result.data?.parentId).toBe(newParentId);
    });

    it('should allow empty update object', () => {
      const emptyData = {};

      const result = validateUpdateDepartmentRequest(emptyData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle null values properly', () => {
      const dataWithNulls = {
        leader: null,
        parentId: null,
      };

      const result = validateUpdateDepartmentRequest(dataWithNulls as any);
      expect(result.success).toBe(true);
      expect(result.data?.leader).toBeUndefined();
      expect(result.data?.parentId).toBeUndefined();
    });

    it('should apply same validation rules as create', () => {
      const invalidData = {
        name: '<script>alert(1)</script>',
      };

      const result = validateUpdateDepartmentRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });
  });

  describe('validateDepartmentQueryParams', () => {
    it('should validate valid query params', () => {
      const validParams = {
        includeSubDepartments: 'true',
        parentId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = validateDepartmentQueryParams(validParams);
      expect(result.success).toBe(true);
      expect(result.data?.includeSubDepartments).toBe(true);
      expect(result.data?.parentId).toBe(validParams.parentId);
    });

    it('should handle includeSubDepartments string to boolean conversion', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: 'anything', expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const params = { includeSubDepartments: input };
        const result = validateDepartmentQueryParams(params);
        expect(result.success).toBe(true);
        expect(result.data?.includeSubDepartments).toBe(expected);
      });
    });

    it('should validate parentId UUID format', () => {
      const invalidParams = {
        parentId: 'not-a-uuid',
      };

      const result = validateDepartmentQueryParams(invalidParams);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('parentId');
    });

    it('should allow empty query params', () => {
      const emptyParams = {};

      const result = validateDepartmentQueryParams(emptyParams);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should allow only includeSubDepartments', () => {
      const params = {
        includeSubDepartments: 'true',
      };

      const result = validateDepartmentQueryParams(params);
      expect(result.success).toBe(true);
      expect(result.data?.includeSubDepartments).toBe(true);
      expect(result.data?.parentId).toBeUndefined();
    });
  });

  describe('validateDepartmentName', () => {
    it('should validate correct format', () => {
      const validNames = [
        '技术部',
        '市场部',
        'IT Department',
        '研发一部',
        '销售部-华东',
      ];

      validNames.forEach(name => {
        const result = validateDepartmentName(name);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid format', () => {
      const invalidNames = [
        '',                    // Empty
        'A'.repeat(51),       // Too long
        '<div>部门</div>',    // HTML tags
        '部门"test"',         // Quotes
        "部门'test'",         // Single quotes
        '部门\\test',         // Backslash
      ];

      invalidNames.forEach(name => {
        const result = validateDepartmentName(name);
        expect(result).toBe(false);
      });
    });
  });
});