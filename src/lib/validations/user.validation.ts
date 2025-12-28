import { z } from 'zod';

/**
 * 邮箱验证规则
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, '邮箱不能为空')
  .email('必须是有效的邮箱地址');

/**
 * 密码验证规则 - 用于注册和创建用户
 */
const strongPasswordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
  .regex(/[a-z]/, '密码必须包含至少一个小写字母')
  .regex(/[0-9]/, '密码必须包含至少一个数字')
  .regex(/[^A-Za-z0-9]/, '密码必须包含至少一个特殊字符');

/**
 * 密码验证规则 - 用于登录（只验证长度）
 */
const passwordSchema = z.string().min(6, '密码至少需要6个字符');

/**
 * 用户角色枚举
 */
const userRoleSchema = z.enum(['EMPLOYEE', 'MANAGER', 'ENTERPRISE_ADMIN', 'SYSTEM_ADMIN']);

/**
 * 姓名验证规则
 */
const nameSchema = z
  .string()
  .trim()
  .min(1, '姓名不能为空')
  .max(50, '姓名不能超过50个字符');

/**
 * 登录请求验证
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * 注册请求验证
 */
export const registerRequestSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  name: nameSchema,
  enterpriseCode: z.string().trim().min(1, '企业代码不能为空'),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/**
 * 创建用户请求验证
 */
export const createUserRequestSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  name: nameSchema,
  role: userRoleSchema.optional().default('EMPLOYEE'),
  position: z.string().trim().optional().transform(val => val || undefined),
  departmentId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform(val => (val ? val : undefined)),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/**
 * 更新用户请求验证
 */
export const updateUserRequestSchema = z
  .object({
    name: nameSchema.optional(),
    password: strongPasswordSchema.optional(),
    role: userRoleSchema.optional(),
    position: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val ? val : undefined)),
    departmentId: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val ? val : undefined)),
  })
  .strict(); // 不允许额外的字段

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

/**
 * 验证登录请求数据
 */
export function validateLoginRequest(data: unknown) {
  return loginRequestSchema.safeParse(data);
}

/**
 * 验证注册请求数据
 */
export function validateRegisterRequest(data: unknown) {
  return registerRequestSchema.safeParse(data);
}

/**
 * 验证创建用户请求数据
 */
export function validateCreateUserRequest(data: unknown) {
  return createUserRequestSchema.safeParse(data);
}

/**
 * 验证更新用户请求数据
 */
export function validateUpdateUserRequest(data: unknown) {
  return updateUserRequestSchema.safeParse(data);
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