import { z } from 'zod';

/**
 * 战略标题验证规则
 */
const strategyTitleSchema = z
  .string()
  .trim()
  .min(1, '标题不能为空')
  .max(200, '标题不能超过200个字符')
  .regex(/^[^<>'"\\]*$/, '标题不能包含特殊字符');

/**
 * 模块类型验证规则
 */
const moduleTypeSchema = z
  .string()
  .trim()
  .min(1, '模块类型不能为空')
  .max(50, '模块类型不能超过50个字符')
  .regex(/^[a-zA-Z0-9_-]+$/, '模块类型只能包含字母、数字、下划线和横杠');

/**
 * 核心问题验证规则
 */
const coreProblemSchema = z
  .string()
  .trim()
  .max(1000, '核心问题不能超过1000个字符')
  .optional()
  .nullable()
  .transform(val => (val === null || val === '' ? undefined : val));

/**
 * 部门ID验证规则
 */
const departmentIdSchema = z
  .string()
  .uuid('部门ID必须是有效的UUID')
  .optional()
  .nullable()
  .transform(val => (val === null || val === '' ? undefined : val));

/**
 * 表格类型枚举
 */
const tableTypeEnum = z.enum([
  'financial',
  'market',
  'value',
  'process',
  'team',
  'review',
  'department_strategy',
], {
  errorMap: () => ({ message: '无效的表格类型' }),
});

/**
 * 表格列验证规则
 */
const tableColumnSchema = z.object({
  key: z.string().min(1, '列键不能为空'),
  title: z.string().min(1, '列标题不能为空'),
  width: z.number().positive('列宽必须是正数').optional(),
  dataIndex: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  fixed: z.enum(['left', 'right']).optional(),
});

/**
 * 创建战略请求验证
 */
export const createStrategyRequestSchema = z.object({
  title: strategyTitleSchema,
  moduleType: moduleTypeSchema,
  departmentId: departmentIdSchema,
  coreProblem: coreProblemSchema,
});

export type CreateStrategyRequest = z.infer<typeof createStrategyRequestSchema>;

/**
 * 更新战略请求验证
 */
export const updateStrategyRequestSchema = z.object({
  title: strategyTitleSchema.optional(),
  moduleType: moduleTypeSchema.optional(),
  departmentId: departmentIdSchema,
  coreProblem: coreProblemSchema,
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export type UpdateStrategyRequest = z.infer<typeof updateStrategyRequestSchema>;

/**
 * 战略表格数据验证
 */
export const strategyTableDataSchema = z.object({
  tableType: tableTypeEnum,
  departmentId: departmentIdSchema,
  columns: z.array(tableColumnSchema).min(1, '至少需要一列'),
  data: z.array(z.record(z.string(), z.unknown())),
  rowHeights: z.record(z.string(), z.number().positive()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type StrategyTableData = z.infer<typeof strategyTableDataSchema>;

/**
 * 战略查询参数验证
 */
export const strategyQueryParamsSchema = z.object({
  departmentId: z.string().uuid().optional(),
  moduleType: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  pageSize: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
});

export type StrategyQueryParams = z.infer<typeof strategyQueryParamsSchema>;

/**
 * 验证创建战略请求数据
 */
export function validateCreateStrategyRequest(data: unknown) {
  return createStrategyRequestSchema.safeParse(data);
}

/**
 * 验证更新战略请求数据
 */
export function validateUpdateStrategyRequest(data: unknown) {
  return updateStrategyRequestSchema.safeParse(data);
}

/**
 * 验证战略表格数据
 */
export function validateStrategyTableData(data: unknown) {
  return strategyTableDataSchema.safeParse(data);
}

/**
 * 验证战略查询参数
 */
export function validateStrategyQueryParams(data: unknown) {
  return strategyQueryParamsSchema.safeParse(data);
}

/**
 * 验证表格类型
 */
export function validateTableType(type: string): boolean {
  const result = tableTypeEnum.safeParse(type);
  return result.success;
}

/**
 * 验证模块类型格式
 */
export function validateModuleType(type: string): boolean {
  const result = moduleTypeSchema.safeParse(type);
  return result.success;
}

/**
 * 格式化验证错误信息
 */
export function formatValidationErrors(errors: z.ZodError) {
  const formattedErrors: Record<string, string[]> = {};

  errors.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(issue.message);
  });

  return formattedErrors;
}