import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, rateLimiters } from './rate-limit';
import { createCsrfProtection } from './csrf';
import { applySecurityHeaders, handleCorsPreflightRequest, isSecureOrigin } from './security-headers';
import { errorResponse } from '@/lib/api-response';
import { logHttpRequest, logError, logSecurity } from '@/lib/logger';
import { randomUUID } from 'crypto';

/**
 * 安全中间件配置选项
 */
export interface SecurityMiddlewareOptions {
  enableRateLimit?: boolean;
  enableCsrf?: boolean;
  enableSecurityHeaders?: boolean;
  enableOriginCheck?: boolean;
  rateLimitType?: 'standard' | 'strict' | 'upload';
  customRateLimiter?: (req: NextRequest) => Promise<NextResponse | null>;
}

/**
 * 统一的安全中间件
 * 整合所有安全功能
 */
export async function securityMiddleware(
  request: NextRequest,
  options: SecurityMiddlewareOptions = {}
): Promise<NextResponse | undefined> {
  const {
    enableRateLimit = true,
    enableCsrf = true,
    enableSecurityHeaders = true,
    enableOriginCheck = true,
    rateLimitType = 'standard',
    customRateLimiter,
  } = options;

  // 1. 处理 CORS 预检请求
  const corsResponse = handleCorsPreflightRequest(request);
  if (corsResponse) {
    return corsResponse;
  }

  // 2. 检查请求来源
  if (enableOriginCheck && !isSecureOrigin(request)) {
    return errorResponse('SEC_001', '请求来源不被允许', 403);
  }

  // 3. 应用限流
  if (enableRateLimit) {
    const rateLimiter = customRateLimiter || rateLimiters[rateLimitType];
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // 4. CSRF 保护（仅对非安全方法）
  if (enableCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrfProtection = createCsrfProtection();
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }
  }

  // 返回 undefined 表示通过所有安全检查
  return undefined;
}

/**
 * 为 API 路由创建安全包装器
 */
export function withSecurity<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: SecurityMiddlewareOptions
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;

    // 执行安全检查
    const securityResponse = await securityMiddleware(request, options);
    if (securityResponse) {
      return securityResponse;
    }

    // 执行原始处理器
    const response = await handler(...args);

    // 应用安全响应头
    if (options?.enableSecurityHeaders !== false) {
      return applySecurityHeaders(response);
    }

    return response;
  }) as T;
}

/**
 * 路由级别的安全配置
 */
export interface RouteSecurityConfig {
  [path: string]: SecurityMiddlewareOptions;
}

/**
 * 默认路由安全配置
 */
export const defaultRouteSecurityConfig: RouteSecurityConfig = {
  // Auto-save endpoints - allow higher request frequency
  '/api/enterprise/strategy-table': {
    customRateLimiter: createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 2000,
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
        const path = new URL(req.url).pathname;
        return `${ip}:${path}`;
      },
    }),
  },

  // 认证相关路由 - 使用严格限流
  '/api/auth/login': {
    rateLimitType: 'strict',
    enableCsrf: false, // 登录路由通常不需要 CSRF
  },
  '/api/auth/register': {
    rateLimitType: 'strict',
    enableCsrf: false,
  },
  '/api/auth/reset-password': {
    rateLimitType: 'strict',
  },

  // 文件上传路由 - 使用上传限流
  '/api/upload': {
    rateLimitType: 'upload',
  },

  // 公开 API - 可能需要不同的配置
  '/api/public': {
    enableCsrf: false,
    enableOriginCheck: false,
  },

  // 管理员路由 - 额外的安全措施
  '/api/admin': {
    rateLimitType: 'strict',
    enableOriginCheck: true,
  },
};

/**
 * 根据路径获取安全配置
 */
export function getRouteSecurityConfig(
  path: string,
  customConfig?: RouteSecurityConfig
): SecurityMiddlewareOptions {
  const config = { ...defaultRouteSecurityConfig, ...customConfig };

  // 精确匹配
  if (config[path]) {
    return config[path];
  }

  // 前缀匹配
  for (const [routePath, routeConfig] of Object.entries(config)) {
    if (path.startsWith(routePath)) {
      return routeConfig;
    }
  }

  // 返回默认配置
  return {};
}

/**
 * Next.js 中间件集成
 */
export async function integratedSecurityMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = randomUUID();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // 跳过静态资源
  if (path.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
    return NextResponse.next();
  }

  // 跳过 Next.js 内部路由
  if (path.startsWith('/_next/') || path.startsWith('/__nextjs_')) {
    return NextResponse.next();
  }

  try {
    // 获取路由特定的安全配置
    const securityConfig = getRouteSecurityConfig(path);

    // 应用安全中间件
    const securityResponse = await securityMiddleware(request, securityConfig);
    if (securityResponse) {
      const duration = Date.now() - startTime;

      // 记录安全事件
      const statusCode = securityResponse.status;
      if (statusCode === 403) {
        logSecurity('Forbidden Access', 'high', {
          requestId,
          path,
          method,
          reason: 'Security check failed',
        });
      } else if (statusCode === 429) {
        logSecurity('Rate Limit Exceeded', 'medium', {
          requestId,
          path,
          method,
          reason: 'Too many requests',
        });
      }

      // 记录HTTP请求（失败）
      logHttpRequest(method, path, statusCode, duration, {
        requestId,
        securityBlocked: true,
      });

      return securityResponse;
    }

    // 继续处理请求
    const response = NextResponse.next();

    // 在响应头中添加请求ID
    response.headers.set('x-request-id', requestId);

    // 记录成功的请求（在响应返回后）
    const duration = Date.now() - startTime;
    logHttpRequest(method, path, response.status, duration, {
      requestId,
    });

    // 应用安全响应头
    if (securityConfig.enableSecurityHeaders !== false) {
      return applySecurityHeaders(response);
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录错误
    logError(error, 'Security Middleware', {
      requestId,
      path,
      method,
    });

    // 记录失败的HTTP请求
    logHttpRequest(method, path, 500, duration, {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * 创建自定义安全中间件
 */
export function createCustomSecurityMiddleware(
  config: RouteSecurityConfig
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const path = request.nextUrl.pathname;
    const securityConfig = getRouteSecurityConfig(path, config);

    const securityResponse = await securityMiddleware(request, securityConfig);
    if (securityResponse) {
      return securityResponse;
    }

    const response = NextResponse.next();
    return applySecurityHeaders(response);
  };
}

/**
 * 安全状态检查
 */
export interface SecurityStatus {
  rateLimitEnabled: boolean;
  csrfEnabled: boolean;
  securityHeadersEnabled: boolean;
  originCheckEnabled: boolean;
  httpsOnly: boolean;
}

/**
 * 获取当前安全状态
 */
export function getSecurityStatus(): SecurityStatus {
  return {
    rateLimitEnabled: true,
    csrfEnabled: true,
    securityHeadersEnabled: true,
    originCheckEnabled: true,
    httpsOnly: process.env.NODE_ENV === 'production',
  };
}

/**
 * 安全健康检查端点
 */
export async function securityHealthCheck(): Promise<NextResponse> {
  const status = getSecurityStatus();

  return NextResponse.json({
    success: true,
    security: status,
    timestamp: new Date().toISOString(),
  });
}
