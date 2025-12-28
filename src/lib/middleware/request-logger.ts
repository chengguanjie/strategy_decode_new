import { NextRequest, NextResponse } from 'next/server';
import { logHttpRequest, logError } from '../logger';
import { randomUUID } from 'crypto';

export interface RequestLoggerOptions {
  // 需要忽略的路径
  ignorePaths?: string[];
  // 是否记录请求体
  logBody?: boolean;
  // 是否记录响应体
  logResponse?: boolean;
  // 敏感字段，将被掩码处理
  sensitiveFields?: string[];
}

const defaultOptions: RequestLoggerOptions = {
  ignorePaths: ['/api/health', '/_next', '/favicon.ico'],
  logBody: false,
  logResponse: false,
  sensitiveFields: ['password', 'token', 'secret', 'authorization'],
};

// 掩码敏感数据
function maskSensitiveData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  return masked;
}

// 获取客户端IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return 'unknown';
}

// 请求日志中间件
export function requestLogger(options: RequestLoggerOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async (request: NextRequest) => {
    const startTime = Date.now();
    const requestId = randomUUID();
    const method = request.method;
    const url = request.url;
    const pathname = new URL(url).pathname;

    // 检查是否需要忽略此路径
    if (config.ignorePaths?.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 在请求头中添加请求ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    // 记录请求信息
    const requestMetadata: any = {
      requestId,
      method,
      url: pathname,
      clientIp: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct',
    };

    // 记录请求体（如果启用）
    if (config.logBody && request.body) {
      try {
        const body = await request.json();
        requestMetadata.requestBody = maskSensitiveData(body, config.sensitiveFields!);
      } catch (error) {
        // 无法解析请求体
        requestMetadata.requestBody = 'Unable to parse request body';
      }
    }

    try {
      // 执行下一个中间件或路由处理
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      // 等待响应完成
      await response;

      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // 记录响应信息
      logHttpRequest(method, pathname, statusCode, duration, {
        ...requestMetadata,
        responseHeaders: Object.fromEntries(response.headers.entries()),
      });

      // 在响应头中添加请求ID和处理时间
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-response-time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录错误
      logError(error, 'Request Logger Middleware', {
        ...requestMetadata,
        duration,
      });

      // 记录失败的HTTP请求
      logHttpRequest(method, pathname, 500, duration, {
        ...requestMetadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}

// 导出预配置的中间件
export const defaultRequestLogger = requestLogger();