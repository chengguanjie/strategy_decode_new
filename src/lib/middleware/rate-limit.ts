import { NextRequest, NextResponse } from 'next/server';
import { securityConfig } from '@/config/security';
import { errorResponse } from '@/lib/api-response';

// 内存存储，用于跟踪请求
// 生产环境应使用 Redis
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// 清理过期的记录
const cleanupStore = () => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
};

// 定期清理（每分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStore, 60 * 1000);
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean | Promise<boolean>;
}

/**
 * 创建限流中间件
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = securityConfig.rateLimit.standard.windowMs,
    max = securityConfig.rateLimit.standard.max,
    message = securityConfig.rateLimit.standard.message,
    keyGenerator = (req) => {
      // 默认使用 IP 地址作为限流 key
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
      return ip;
    },
    skip = () => false,
  } = options;

  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    // 检查是否跳过限流
    if (await skip(req)) {
      return null;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    // 获取或初始化记录
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime,
      };
    } else {
      store[key].count++;
    }

    const current = store[key];
    const remaining = Math.max(0, max - current.count);
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);

    // 设置限流相关响应头
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', max.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

    // 检查是否超过限制
    if (current.count > max) {
      headers.set('Retry-After', retryAfter.toString());

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message,
            details: {
              limit: max,
              windowMs,
              retryAfter,
            },
          },
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    // 未超过限制，返回 null 表示继续处理
    return null;
  };
}

/**
 * 预定义的限流器
 */
export const rateLimiters = {
  // 标准 API 限流
  standard: createRateLimiter(securityConfig.rateLimit.standard),

  // 严格限流（登录、注册等）
  strict: createRateLimiter({
    ...securityConfig.rateLimit.strict,
    keyGenerator: (req) => {
      // 对于严格限流，结合 IP 和路径
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
      const path = new URL(req.url).pathname;
      return `${ip}:${path}`;
    },
  }),

  // 文件上传限流
  upload: createRateLimiter(securityConfig.rateLimit.upload),
};

/**
 * 用于 API 路由的限流包装器
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: RateLimitOptions
): T {
  const limiter = createRateLimiter(options);

  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;
    const rateLimitResponse = await limiter(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(...args);
  }) as T;
}

/**
 * 基于用户的限流
 */
export function createUserRateLimiter(options: RateLimitOptions = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      // 从请求中获取用户ID（需要先进行认证）
      const userId = (req as any).userId || 'anonymous';
      return `user:${userId}`;
    },
  });
}

/**
 * 基于 API Key 的限流
 */
export function createApiKeyRateLimiter(options: RateLimitOptions = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      const apiKey = req.headers.get('x-api-key') || 'no-key';
      return `api:${apiKey}`;
    },
  });
}