/**
 * Zod validation schemas for API input validation
 * 
 * This module provides centralized validation schemas for all API endpoints.
 * Using Zod ensures type-safe validation with clear error messages.
 */

import { z } from 'zod';

// ============================================
// Common Validation Patterns
// ============================================

/**
 * Email validation with proper format checking
 */
export const emailSchema = z
  .string()
  .min(1, '邮箱不能为空')
  .email('请输入有效的邮箱地址');

/**
 * Password validation with minimum requirements
 */
export const passwordSchema = z
  .string()
  .min(6, '密码至少需要6个字符')
  .max(100, '密码不能超过100个字符');

/**
 * Name validation
 */
export const nameSchema = z
  .string()
  .min(1, '名称不能为空')
  .max(100, '名称不能超过100个字符');

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('无效的ID格式');

/**
 * Optional UUID validation
 */
export const optionalUuidSchema = z.string().uuid('无效的ID格式').optional().nullable();

// ============================================
// Auth Schemas
// ============================================

/**
 * Login request validation - 支持邮箱或手机号登录
 */
export const loginSchema = z.object({
  email: z.string().min(1, '账号不能为空').refine((val) => {
    // 检查是否为有效邮箱或11位手机号
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  }, '请输入有效的邮箱或手机号'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * Register request validation
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  enterpriseCode: z.string().optional(),
});

// ============================================
// User Schemas
// ============================================

/**
 * Create user request validation
 */
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['PLATFORM_ADMIN', 'ENTERPRISE_ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  departmentId: optionalUuidSchema,
  position: z.string().max(100, '职位不能超过100个字符').optional().nullable(),
});

// ============================================
// Department Schemas
// ============================================

/**
 * Create department request validation
 */
export const createDepartmentSchema = z.object({
  name: nameSchema,
  leader: z.string().max(100, '负责人名称不能超过100个字符').optional().nullable(),
  parentId: optionalUuidSchema,
});

/**
 * Update department request validation
 */
export const updateDepartmentSchema = z.object({
  name: nameSchema.optional(),
  leader: z.string().max(100, '负责人名称不能超过100个字符').optional().nullable(),
});

// ============================================
// Customer Structure Schemas
// ============================================

/**
 * Customer structure data validation
 */
export const customerStructureSchema = z.object({
  tableType: z.string().min(1, 'tableType不能为空'),
  departmentId: z.string().optional().nullable(),
  columns: z.array(z.object({
    key: z.string(),
    title: z.string(),
    width: z.number().optional(),
  })),
  data: z.array(z.record(z.string(), z.unknown())),
  rowHeights: z.record(z.string(), z.number()).optional(),
});

// ============================================
// Strategy Schemas
// ============================================

/**
 * Strategy table data validation - 用于持久化各类战略表格数据
 * tableType: financial, market, value, process, team, review, department_strategy
 */
const tableTypeValues = ['financial', 'market', 'value', 'process', 'team', 'review', 'department_strategy', 'performance_deduction', 'growth_strategies', 'task_decomposition'] as const;

/**
 * 部门ID规范化：将 null/undefined/空字符串统一转换为空字符串
 * 确保数据库唯一约束的一致性
 */
const normalizedDepartmentId = z.string().optional().nullable().transform(val => val || '');

export const strategyTableDataSchema = z.object({
  tableType: z.enum(tableTypeValues, { message: '无效的表格类型' }),
  departmentId: normalizedDepartmentId,
  columns: z.array(z.object({
    key: z.string(),
    title: z.string(),
    width: z.number().optional(),
  })),
  data: z.array(z.record(z.string(), z.unknown())),
  rowHeights: z.record(z.string(), z.number()).optional(),
});

/**
 * Strategy table query params validation
 */
export const strategyTableQuerySchema = z.object({
  tableType: z.enum(tableTypeValues, { message: '无效的表格类型' }),
  departmentId: normalizedDepartmentId,
});

/**
 * Create strategy request validation
 */
export const createStrategySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  moduleType: z.string().min(1, '模块类型不能为空'),
  departmentId: optionalUuidSchema,
  coreProblem: z.string().max(1000, '核心问题不能超过1000个字符').optional().nullable(),
});

/**
 * Update strategy request validation
 */
export const updateStrategySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  moduleType: z.string().min(1, '模块类型不能为空').optional(),
  departmentId: optionalUuidSchema,
  coreProblem: z.string().max(1000, '核心问题不能超过1000个字符').optional().nullable(),
});

// ============================================
// Dashboard Schemas
// ============================================

/**
 * Create dashboard card request validation
 */
export const createDashboardCardSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100个字符'),
  targetValue: z.string().min(1, '目标值不能为空'),
  currentValue: z.string().min(1, '当前值不能为空'),
  unit: z.string().min(1, '单位不能为空').max(20, '单位不能超过20个字符'),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['success', 'warning', 'danger']).optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * Update dashboard card request validation
 */
export const updateDashboardCardSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100个字符').optional(),
  targetValue: z.string().optional(),
  currentValue: z.string().optional(),
  unit: z.string().max(20, '单位不能超过20个字符').optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['success', 'warning', 'danger']).optional(),
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CustomerStructureInput = z.infer<typeof customerStructureSchema>;
export type StrategyTableDataInput = z.infer<typeof strategyTableDataSchema>;
export type StrategyTableQueryInput = z.infer<typeof strategyTableQuerySchema>;
export type CreateStrategyInput = z.infer<typeof createStrategySchema>;
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
export type CreateDashboardCardInput = z.infer<typeof createDashboardCardSchema>;
export type UpdateDashboardCardInput = z.infer<typeof updateDashboardCardSchema>;
