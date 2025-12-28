import { NextResponse } from 'next/server';

/**
 * 统一API响应格式
 * 
 * 成功响应: { success: true, data: T, message?: string }
 * 错误响应: { success: false, error: { code: string, message: string, details?: unknown } }
 */

// 成功响应接口
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应接口
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 分页响应接口
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 统一响应类型
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 可选的成功消息
 * @param status HTTP状态码，默认200
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * 创建错误响应
 * @param code 错误码
 * @param message 错误消息
 * @param status HTTP状态码，默认500
 * @param details 可选的错误详情（仅开发环境显示）
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  // 仅在开发环境下包含详细错误信息
  if (process.env.NODE_ENV !== 'production' && details) {
    response.error.details = details;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * 创建分页响应
 * @param data 数据数组
 * @param page 当前页码
 * @param pageSize 每页大小
 * @param total 总记录数
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse<ApiPaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * 标准错误码常量
 */
export const ErrorCodes = {
  // 认证相关 (AUTH_0xx)
  AUTH_INVALID_TOKEN: { code: 'AUTH_001', message: '无效的认证令牌', status: 401 },
  AUTH_EXPIRED_TOKEN: { code: 'AUTH_002', message: '认证令牌已过期', status: 401 },
  AUTH_UNAUTHORIZED: { code: 'AUTH_003', message: '无权访问此资源', status: 403 },
  AUTH_MISSING_TOKEN: { code: 'AUTH_004', message: '缺少认证令牌', status: 401 },
  AUTH_USER_NOT_FOUND: { code: 'AUTH_005', message: '用户不存在', status: 401 },
  AUTH_INVALID_PASSWORD: { code: 'AUTH_006', message: '密码错误', status: 401 },
  AUTH_LOGIN_FAILED: { code: 'AUTH_007', message: '登录失败', status: 500 },
  
  // 注册相关 (REG_0xx)
  REG_EMAIL_EXISTS: { code: 'REG_001', message: '邮箱已被注册', status: 400 },
  REG_INVALID_ENTERPRISE: { code: 'REG_002', message: '企业代码无效', status: 400 },
  REG_FAILED: { code: 'REG_003', message: '注册失败', status: 500 },
  
  // 验证相关 (VAL_0xx)
  VALIDATION_FAILED: { code: 'VAL_001', message: '请求参数验证失败', status: 400 },
  VALIDATION_MISSING_FIELD: { code: 'VAL_002', message: '缺少必需字段', status: 400 },
  VALIDATION_INVALID_FORMAT: { code: 'VAL_003', message: '字段格式无效', status: 400 },
  
  // 资源相关 (RES_0xx)
  NOT_FOUND: { code: 'RES_001', message: '资源不存在', status: 404 },
  ALREADY_EXISTS: { code: 'RES_002', message: '资源已存在', status: 409 },
  
  // 部门相关 (DEPT_0xx)
  DEPT_LIST_FAILED: { code: 'DEPT_001', message: '获取部门列表失败', status: 500 },
  DEPT_CREATE_FAILED: { code: 'DEPT_002', message: '创建部门失败', status: 500 },
  DEPT_UPDATE_FAILED: { code: 'DEPT_003', message: '更新部门失败', status: 500 },
  DEPT_DELETE_FAILED: { code: 'DEPT_004', message: '删除部门失败', status: 500 },
  DEPT_NOT_FOUND: { code: 'DEPT_005', message: '部门不存在', status: 404 },
  
  // 用户相关 (USER_0xx)
  USER_LIST_FAILED: { code: 'USER_001', message: '获取用户列表失败', status: 500 },
  USER_EMAIL_EXISTS: { code: 'USER_002', message: '该账号已被注册', status: 400 },
  USER_CREATE_FAILED: { code: 'USER_003', message: '创建用户失败', status: 500 },
  USER_UPDATE_FAILED: { code: 'USER_004', message: '更新用户失败', status: 500 },
  USER_DELETE_FAILED: { code: 'USER_005', message: '删除用户失败', status: 500 },
  USER_NOT_FOUND: { code: 'USER_006', message: '用户不存在', status: 404 },
  
  // 企业相关 (ENT_0xx)
  ENT_LIST_FAILED: { code: 'ENT_001', message: '获取企业列表失败', status: 500 },
  ENT_CREATE_FAILED: { code: 'ENT_002', message: '创建企业失败', status: 500 },
  ENT_UPDATE_FAILED: { code: 'ENT_003', message: '更新企业失败', status: 500 },
  ENT_DELETE_FAILED: { code: 'ENT_004', message: '删除企业失败', status: 500 },
  ENT_NOT_FOUND: { code: 'ENT_005', message: '企业不存在', status: 404 },
  ENT_REQUIRED: { code: 'ENT_006', message: '需要企业上下文', status: 400 },
  
  // 战略相关 (STR_0xx)
  STR_LIST_FAILED: { code: 'STR_001', message: '获取战略列表失败', status: 500 },
  STR_CREATE_FAILED: { code: 'STR_002', message: '创建战略失败', status: 500 },
  STR_UPDATE_FAILED: { code: 'STR_003', message: '更新战略失败', status: 500 },
  STR_DELETE_FAILED: { code: 'STR_004', message: '删除战略失败', status: 500 },
  STR_NOT_FOUND: { code: 'STR_005', message: '战略不存在', status: 404 },
  
  // 战略表格相关 (STBL_0xx)
  STBL_LIST_FAILED: { code: 'STBL_001', message: '获取表格数据失败', status: 500 },
  STBL_SAVE_FAILED: { code: 'STBL_002', message: '保存表格数据失败', status: 500 },
  STBL_NOT_FOUND: { code: 'STBL_003', message: '表格数据不存在', status: 404 },
  
  // 仪表盘相关 (DASH_0xx)
  DASH_LIST_FAILED: { code: 'DASH_001', message: '获取仪表盘数据失败', status: 500 },
  DASH_UPDATE_FAILED: { code: 'DASH_002', message: '更新仪表盘失败', status: 500 },
  DASH_CARD_NOT_FOUND: { code: 'DASH_003', message: '卡片不存在', status: 404 },
  DASH_CARD_UPDATE_FAILED: { code: 'DASH_004', message: '更新卡片失败', status: 500 },
  DASH_CARD_DELETE_FAILED: { code: 'DASH_005', message: '删除卡片失败', status: 500 },
  
  // 客户结构相关 (CUST_0xx)
  CUST_LIST_FAILED: { code: 'CUST_001', message: '获取客户结构失败', status: 500 },
  CUST_UPDATE_FAILED: { code: 'CUST_002', message: '更新客户结构失败', status: 500 },
  
  // AI相关 (AI_0xx)
  AI_SERVICE_ERROR: { code: 'AI_001', message: 'AI服务错误', status: 500 },
  AI_CONFIG_MISSING: { code: 'AI_002', message: '请先配置AI API密钥', status: 400 },
  AI_RESPONSE_ERROR: { code: 'AI_003', message: 'AI响应格式错误', status: 500 },
  
  // 服务器错误 (INT_0xx)
  INTERNAL_ERROR: { code: 'INT_001', message: '服务器内部错误', status: 500 },
  DATABASE_ERROR: { code: 'INT_002', message: '数据库操作失败', status: 500 },
  EXTERNAL_SERVICE_ERROR: { code: 'INT_003', message: '外部服务调用失败', status: 502 },
} as const;

// 错误码类型
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * 使用预定义错误码创建错误响应
 * @param errorCode 预定义的错误码
 * @param details 可选的错误详情
 * @param customMessage 可选的自定义消息（覆盖默认消息）
 */
export function errorFromCode(
  errorCode: ErrorCode,
  details?: unknown,
  customMessage?: string
): NextResponse<ApiErrorResponse> {
  const error = ErrorCodes[errorCode];
  return errorResponse(
    error.code,
    customMessage || error.message,
    error.status,
    details
  );
}
