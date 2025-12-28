import { z } from 'zod';

/**
 * 部门名称验证规则
 */
const departmentNameSchema = z
  .string()
  .trim()
  .min(1, '部门名称不能为空')
  .max(50, '部门名称不能超过50个字符')
  .regex(/^[^<>'"\\]*$/, '部门名称不能包含特殊字符');

/**
 * 部门负责人验证规则
 */
const departmentLeaderSchema = z
  .string()
  .trim()
  .max(50, '负责人名称不能超过50个字符')
  .regex(/^[^<>'"\\]*$/, '负责人名称不能包含特殊字符')
  .optional()
  .nullable()
  .transform(val => (val === null || val === '' ? undefined : val));

/**
 * 父部门ID验证规则
 */
const parentIdSchema = z
  .string()
  .uuid('父部门ID必须是有效的UUID')
  .optional()
  .nullable()
  .transform(val => (val === null || val === '' ? undefined : val));

/**
 * 创建部门请求验证
 */
export const createDepartmentRequestSchema = z.object({
  name: departmentNameSchema,
  leader: departmentLeaderSchema,
  parentId: parentIdSchema,
});

export type CreateDepartmentRequest = z.infer<typeof createDepartmentRequestSchema>;

/**
 * 更新部门请求验证
 */
export const updateDepartmentRequestSchema = z.object({
  name: departmentNameSchema.optional(),
  leader: departmentLeaderSchema,
  parentId: parentIdSchema,
});

export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentRequestSchema>;

/**
 * 部门查询参数验证
 */
export const departmentQueryParamsSchema = z.object({
  includeSubDepartments: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  parentId: z.string().uuid().optional(),
});

export type DepartmentQueryParams = z.infer<typeof departmentQueryParamsSchema>;

/**
 * 验证创建部门请求数据
 */
export function validateCreateDepartmentRequest(data: unknown) {
  return createDepartmentRequestSchema.safeParse(data);
}

/**
 * 验证更新部门请求数据
 */
export function validateUpdateDepartmentRequest(data: unknown) {
  return updateDepartmentRequestSchema.safeParse(data);
}

/**
 * 验证部门查询参数
 */
export function validateDepartmentQueryParams(data: unknown) {
  return departmentQueryParamsSchema.safeParse(data);
}

/**
 * 验证部门名称格式
 */
export function validateDepartmentName(name: string): boolean {
  const result = departmentNameSchema.safeParse(name);
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