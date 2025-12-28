import { NextResponse } from 'next/server';
import { errorResponse, ErrorCodes, ErrorCode } from './api-response';
import { trackError } from './error-tracking';

/**
 * 应用程序错误基类
 * 用于在应用程序中抛出可控的错误，并自动转换为统一的API响应格式
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // 确保原型链正确
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 从预定义错误码创建AppError
   */
  static fromCode(errorCode: ErrorCode, details?: unknown, customMessage?: string): AppError {
    const error = ErrorCodes[errorCode];
    return new AppError(
      error.code,
      customMessage || error.message,
      error.status,
      details
    );
  }

  /**
   * 将错误转换为NextResponse
   */
  toResponse(): NextResponse {
    return errorResponse(this.code, this.message, this.statusCode, this.details);
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败', code: string = 'AUTH_001', details?: unknown) {
    super(code, message, 401, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '无权访问此资源', code: string = 'AUTH_003', details?: unknown) {
    super(code, message, 403, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string = '请求参数验证失败', code: string = 'VAL_001', details?: unknown) {
    super(code, message, 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', code: string = 'RES_001', details?: unknown) {
    super(code, message, 404, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 资源冲突错误（如重复创建）
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源已存在', code: string = 'RES_002', details?: unknown) {
    super(code, message, 409, details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败', code: string = 'INT_002', details?: unknown) {
    super(code, message, 500, details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * 外部服务错误
 */
export class ExternalServiceError extends AppError {
  constructor(message: string = '外部服务调用失败', code: string = 'INT_003', details?: unknown) {
    super(code, message, 502, details);
    this.name = 'ExternalServiceError';
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * 将任意错误转换为AppError
 * 用于统一错误处理
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError('INT_001', error.message, 500, {
      originalError: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
  
  return new AppError('INT_001', '服务器内部错误', 500, {
    originalError: String(error),
  });
}

/**
 * 错误处理包装器
 * 用于包装API处理函数，自动捕获并转换错误
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const appError = toAppError(error);

      // 追踪错误到 Sentry 和日志
      trackError(error, {
        tags: {
          errorCode: appError.code,
          statusCode: String(appError.statusCode),
        },
        extra: {
          details: appError.details,
        },
        level: appError.statusCode >= 500 ? 'error' : 'warning',
      }, 'API Handler');

      return appError.toResponse();
    }
  }) as T;
}

/**
 * 断言函数 - 用于验证条件，失败时抛出AppError
 */
export function assertCondition(
  condition: boolean,
  errorCode: ErrorCode,
  customMessage?: string
): asserts condition {
  if (!condition) {
    throw AppError.fromCode(errorCode, undefined, customMessage);
  }
}

/**
 * 断言非空 - 用于验证值存在，失败时抛出NotFoundError
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = '资源不存在',
  code: string = 'RES_001'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message, code);
  }
}
