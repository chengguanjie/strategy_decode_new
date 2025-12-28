import { z } from 'zod';

/**
 * 企业名称验证规则
 */
const enterpriseNameSchema = z
  .string()
  .trim()
  .min(1, '企业名称不能为空')
  .max(100, '企业名称不能超过100个字符');

/**
 * 企业代码验证规则
 * 格式：5-10个大写字母或数字
 */
const enterpriseCodeSchema = z
  .string()
  .trim()
  .min(1, '企业代码不能为空')
  .regex(/^[A-Z0-9]{5,10}$/, '企业代码必须是5-10个大写字母或数字');

/**
 * 企业描述验证规则
 */
const enterpriseDescriptionSchema = z
  .string()
  .trim()
  .max(500, '企业描述不能超过500个字符')
  .optional()
  .transform(val => val || undefined);

/**
 * 联系人姓名验证规则
 */
const contactNameSchema = z
  .string()
  .trim()
  .max(50, '联系人姓名不能超过50个字符')
  .optional()
  .transform(val => val || undefined);

/**
 * 联系电话验证规则 - 中国手机号
 */
const contactPhoneSchema = z
  .string()
  .trim()
  .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
  .optional()
  .nullable()
  .transform(val => (val ? val : undefined));

/**
 * 联系邮箱验证规则
 */
const contactEmailSchema = z
  .string()
  .trim()
  .email('请输入有效的邮箱地址')
  .optional()
  .nullable()
  .transform(val => (val ? val : undefined));

/**
 * 地址验证规则
 */
const addressSchema = z
  .string()
  .trim()
  .max(200, '地址不能超过200个字符')
  .optional()
  .transform(val => val || undefined);

/**
 * Logo URL验证规则
 */
const logoSchema = z
  .string()
  .trim()
  .url('Logo必须是有效的URL')
  .regex(/^https?:\/\//, 'Logo URL必须以http://或https://开头')
  .optional()
  .nullable()
  .transform(val => (val ? val : undefined));

/**
 * 企业状态枚举
 */
const enterpriseStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

/**
 * 创建企业请求验证
 */
export const createEnterpriseRequestSchema = z.object({
  name: enterpriseNameSchema,
  code: enterpriseCodeSchema,
  description: enterpriseDescriptionSchema,
  contactName: contactNameSchema,
  contactPhone: contactPhoneSchema,
  contactEmail: contactEmailSchema,
  address: addressSchema,
  logo: logoSchema,
});

export type CreateEnterpriseRequest = z.infer<typeof createEnterpriseRequestSchema>;

/**
 * 更新企业请求验证
 * 不允许更新企业代码
 */
export const updateEnterpriseRequestSchema = z
  .object({
    name: enterpriseNameSchema.optional(),
    description: z
      .string()
      .trim()
      .max(500, '企业描述不能超过500个字符')
      .optional()
      .nullable()
      .transform(val => (val === null || val === '' ? undefined : val)),
    contactName: z
      .string()
      .trim()
      .max(50, '联系人姓名不能超过50个字符')
      .optional()
      .nullable()
      .transform(val => (val === null || val === '' ? undefined : val)),
    contactPhone: contactPhoneSchema,
    contactEmail: contactEmailSchema,
    address: z
      .string()
      .trim()
      .max(200, '地址不能超过200个字符')
      .optional()
      .nullable()
      .transform(val => (val === null || val === '' ? undefined : val)),
    logo: logoSchema,
    status: enterpriseStatusSchema.optional(),
    // 明确忽略 code 字段
    code: z.any().optional(),
  })
  .transform(data => {
    // 移除 code 字段，即使它被提供
    const { code, ...rest } = data as any;
    return rest;
  })

export type UpdateEnterpriseRequest = z.infer<typeof updateEnterpriseRequestSchema>;

/**
 * 验证创建企业请求数据
 */
export function validateCreateEnterpriseRequest(data: unknown) {
  return createEnterpriseRequestSchema.safeParse(data);
}

/**
 * 验证更新企业请求数据
 */
export function validateUpdateEnterpriseRequest(data: unknown) {
  return updateEnterpriseRequestSchema.safeParse(data);
}

/**
 * 验证企业代码格式
 */
export function validateEnterpriseCode(code: string): boolean {
  const result = enterpriseCodeSchema.safeParse(code);
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