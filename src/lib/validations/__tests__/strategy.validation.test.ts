import {
  validateCreateStrategyRequest,
  validateUpdateStrategyRequest,
  validateStrategyTableData,
  validateStrategyQueryParams,
  validateTableType,
  validateModuleType,
} from '../strategy.validation';

describe('Strategy Validation', () => {
  describe('validateCreateStrategyRequest', () => {
    it('should validate valid strategy creation request', () => {
      const validData = {
        title: '2024年度战略规划',
        moduleType: 'annual-planning',
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
        coreProblem: '如何提升市场份额和客户满意度',
      };

      const result = validateCreateStrategyRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should validate with minimal required fields', () => {
      const minimalData = {
        title: '季度战略',
        moduleType: 'quarterly',
      };

      const result = validateCreateStrategyRequest(minimalData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalData);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        moduleType: 'planning',
      };

      const result = validateCreateStrategyRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('title');
    });

    it('should reject title longer than 200 characters', () => {
      const longTitle = 'A'.repeat(201);
      const invalidData = {
        title: longTitle,
        moduleType: 'planning',
      };

      const result = validateCreateStrategyRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('title');
    });

    it('should reject title with special characters', () => {
      const invalidTitles = [
        '战略<script>',
        '战略"test"',
        "战略'test'",
        '战略\\test',
        '<div>战略</div>',
      ];

      invalidTitles.forEach(title => {
        const data = {
          title,
          moduleType: 'planning',
        };

        const result = validateCreateStrategyRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('title');
      });
    });

    it('should validate module type format', () => {
      const validModuleTypes = [
        'annual-planning',
        'quarterly_review',
        'department-strategy',
        'market_analysis',
        'team_efficiency',
      ];

      validModuleTypes.forEach(moduleType => {
        const data = {
          title: '战略规划',
          moduleType,
        };

        const result = validateCreateStrategyRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.moduleType).toBe(moduleType);
      });
    });

    it('should reject invalid module type format', () => {
      const invalidModuleTypes = [
        '',                    // Empty
        'module type',         // Contains space
        'module@type',         // Contains special char
        '模块类型',            // Chinese characters
        'module.type',         // Contains dot
      ];

      invalidModuleTypes.forEach(moduleType => {
        const data = {
          title: '战略',
          moduleType,
        };

        const result = validateCreateStrategyRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('moduleType');
      });
    });

    it('should handle core problem field', () => {
      const dataWithCoreProblem = {
        title: '战略规划',
        moduleType: 'planning',
        coreProblem: '当前面临的核心挑战是什么？如何应对？',
      };

      const result = validateCreateStrategyRequest(dataWithCoreProblem);
      expect(result.success).toBe(true);
      expect(result.data?.coreProblem).toBe(dataWithCoreProblem.coreProblem);
    });

    it('should reject core problem longer than 1000 characters', () => {
      const longProblem = 'A'.repeat(1001);
      const data = {
        title: '战略',
        moduleType: 'planning',
        coreProblem: longProblem,
      };

      const result = validateCreateStrategyRequest(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('coreProblem');
    });

    it('should handle null core problem', () => {
      const dataWithNullProblem = {
        title: '战略',
        moduleType: 'planning',
        coreProblem: null,
      };

      const result = validateCreateStrategyRequest(dataWithNullProblem as any);
      expect(result.success).toBe(true);
      expect(result.data?.coreProblem).toBeUndefined();
    });

    it('should validate department ID format', () => {
      const validDeptId = '123e4567-e89b-12d3-a456-426614174000';
      const data = {
        title: '部门战略',
        moduleType: 'department',
        departmentId: validDeptId,
      };

      const result = validateCreateStrategyRequest(data);
      expect(result.success).toBe(true);
      expect(result.data?.departmentId).toBe(validDeptId);
    });

    it('should reject invalid department ID', () => {
      const invalidDeptIds = [
        'not-a-uuid',
        '123',
        'xyz-456',
        '123e4567-e89b-12d3-a456',
      ];

      invalidDeptIds.forEach(departmentId => {
        const data = {
          title: '战略',
          moduleType: 'planning',
          departmentId,
        };

        const result = validateCreateStrategyRequest(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('departmentId');
      });
    });

    it('should trim string fields', () => {
      const dataWithSpaces = {
        title: '  战略规划  ',
        moduleType: '  annual-planning  ',
        coreProblem: '  核心问题  ',
      };

      const result = validateCreateStrategyRequest(dataWithSpaces);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('战略规划');
      expect(result.data?.moduleType).toBe('annual-planning');
      expect(result.data?.coreProblem).toBe('核心问题');
    });
  });

  describe('validateUpdateStrategyRequest', () => {
    it('should validate valid update request', () => {
      const validData = {
        title: '更新后的战略规划',
        moduleType: 'updated-planning',
        status: 'PUBLISHED' as const,
      };

      const result = validateUpdateStrategyRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should allow partial updates', () => {
      const partialData = {
        title: '只更新标题',
      };

      const result = validateUpdateStrategyRequest(partialData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialData);
    });

    it('should validate status enum', () => {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

      validStatuses.forEach(status => {
        const data = {
          status: status as any,
        };

        const result = validateUpdateStrategyRequest(data);
        expect(result.success).toBe(true);
        expect(result.data?.status).toBe(status);
      });
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'PENDING',
      };

      const result = validateUpdateStrategyRequest(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('status');
    });

    it('should handle null values properly', () => {
      const dataWithNulls = {
        coreProblem: null,
        departmentId: null,
      };

      const result = validateUpdateStrategyRequest(dataWithNulls as any);
      expect(result.success).toBe(true);
      expect(result.data?.coreProblem).toBeUndefined();
      expect(result.data?.departmentId).toBeUndefined();
    });

    it('should allow empty update object', () => {
      const emptyData = {};

      const result = validateUpdateStrategyRequest(emptyData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('validateStrategyTableData', () => {
    it('should validate valid table data', () => {
      const validData = {
        tableType: 'financial',
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
        columns: [
          { key: 'name', title: '项目名称', width: 200 },
          { key: 'value', title: '金额', width: 150 },
        ],
        data: [
          { name: '收入', value: 1000000 },
          { name: '支出', value: 800000 },
        ],
        rowHeights: { '0': 50, '1': 60 },
      };

      const result = validateStrategyTableData(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should validate table type enum', () => {
      const validTableTypes = [
        'financial',
        'market',
        'value',
        'process',
        'team',
        'review',
        'department_strategy',
      ];

      validTableTypes.forEach(tableType => {
        const data = {
          tableType,
          columns: [{ key: 'col1', title: '列1' }],
          data: [],
        };

        const result = validateStrategyTableData(data);
        expect(result.success).toBe(true);
        expect(result.data?.tableType).toBe(tableType);
      });
    });

    it('should reject invalid table type', () => {
      const invalidData = {
        tableType: 'invalid_type',
        columns: [{ key: 'col1', title: '列1' }],
        data: [],
      };

      const result = validateStrategyTableData(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('tableType');
    });

    it('should require at least one column', () => {
      const invalidData = {
        tableType: 'financial',
        columns: [],
        data: [],
      };

      const result = validateStrategyTableData(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('columns');
    });

    it('should validate column structure', () => {
      const validColumns = [
        { key: 'id', title: 'ID', width: 100, align: 'center', fixed: 'left' },
        { key: 'name', title: '名称', dataIndex: 'name' },
        { key: 'value', title: '值', align: 'right' },
      ];

      const data = {
        tableType: 'financial',
        columns: validColumns,
        data: [],
      };

      const result = validateStrategyTableData(data as any);
      expect(result.success).toBe(true);
    });

    it('should reject columns without key or title', () => {
      const invalidColumns = [
        { key: '', title: '标题' },  // Empty key
        { key: 'col1', title: '' },  // Empty title
      ];

      invalidColumns.forEach(column => {
        const data = {
          tableType: 'financial',
          columns: [column],
          data: [],
        };

        const result = validateStrategyTableData(data);
        expect(result.success).toBe(false);
      });
    });

    it('should accept empty data array', () => {
      const data = {
        tableType: 'market',
        columns: [{ key: 'col1', title: '列1' }],
        data: [],
      };

      const result = validateStrategyTableData(data);
      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual([]);
    });

    it('should validate row heights as positive numbers', () => {
      const invalidData = {
        tableType: 'team',
        columns: [{ key: 'col1', title: '列1' }],
        data: [],
        rowHeights: { '0': -10, '1': 0 },
      };

      const result = validateStrategyTableData(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle optional metadata', () => {
      const dataWithMetadata = {
        tableType: 'process',
        columns: [{ key: 'step', title: '步骤' }],
        data: [],
        metadata: {
          createdBy: 'user123',
          version: 1,
          tags: ['important', 'Q4'],
        },
      };

      const result = validateStrategyTableData(dataWithMetadata);
      expect(result.success).toBe(true);
      expect(result.data?.metadata).toEqual(dataWithMetadata.metadata);
    });
  });

  describe('validateStrategyQueryParams', () => {
    it('should validate valid query params', () => {
      const validParams = {
        departmentId: '123e4567-e89b-12d3-a456-426614174000',
        moduleType: 'planning',
        status: 'PUBLISHED',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        page: '1',
        pageSize: '20',
      };

      const result = validateStrategyQueryParams(validParams);
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(20);
    });

    it('should transform string numbers to numbers', () => {
      const params = {
        page: '5',
        pageSize: '50',
      };

      const result = validateStrategyQueryParams(params);
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(5);
      expect(result.data?.pageSize).toBe(50);
    });

    it('should reject page size over 100', () => {
      const params = {
        pageSize: '150',
      };

      const result = validateStrategyQueryParams(params);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('pageSize');
    });

    it('should reject invalid dates', () => {
      const invalidParams = [
        { startDate: 'not-a-date' },
        { endDate: '2024-13-01T00:00:00Z' },  // Invalid month
        { startDate: '2024-01-32T00:00:00Z' }, // Invalid day
      ];

      invalidParams.forEach(params => {
        const result = validateStrategyQueryParams(params);
        expect(result.success).toBe(false);
      });
    });

    it('should allow empty query params', () => {
      const emptyParams = {};

      const result = validateStrategyQueryParams(emptyParams);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should reject non-numeric page values', () => {
      const params = {
        page: 'abc',
        pageSize: 'xyz',
      };

      const result = validateStrategyQueryParams(params);
      expect(result.success).toBe(false);
    });
  });

  describe('validateTableType', () => {
    it('should validate correct table types', () => {
      const validTypes = [
        'financial',
        'market',
        'value',
        'process',
        'team',
        'review',
        'department_strategy',
      ];

      validTypes.forEach(type => {
        const result = validateTableType(type);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid table types', () => {
      const invalidTypes = [
        'invalid',
        'financial_report',
        'FINANCIAL',
        'market-analysis',
        '',
      ];

      invalidTypes.forEach(type => {
        const result = validateTableType(type);
        expect(result).toBe(false);
      });
    });
  });

  describe('validateModuleType', () => {
    it('should validate correct module types', () => {
      const validTypes = [
        'annual-planning',
        'quarterly_review',
        'team-efficiency',
        'market_analysis_2024',
        'dept-001',
      ];

      validTypes.forEach(type => {
        const result = validateModuleType(type);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid module types', () => {
      const invalidTypes = [
        '',                  // Empty
        'module type',       // Contains space
        'module@type',       // Contains special char
        '模块类型',          // Chinese characters
        'module.type',       // Contains dot
        'module/type',       // Contains slash
      ];

      invalidTypes.forEach(type => {
        const result = validateModuleType(type);
        expect(result).toBe(false);
      });
    });
  });
});