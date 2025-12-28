import { NextRequest, NextResponse } from 'next/server';
import { cache, CacheKeys, CacheTTL } from '@/lib/redis';
import { log, logPerformance } from '@/lib/logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number;
  key?: string;
  varyBy?: string[];
  condition?: (req: NextRequest) => boolean;
  tags?: string[];
}

/**
 * API 响应缓存中间件
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 检查是否应该使用缓存
    if (options.condition && !options.condition(req)) {
      return handler(req);
    }

    // 生成缓存键
    const cacheKey = generateCacheKey(req, options);

    // 尝试从缓存获取
    const startTime = Date.now();
    const cachedResponse = await cache.get<CachedResponse>(cacheKey);

    if (cachedResponse) {
      logPerformance('api.cache.hit', Date.now() - startTime, {
        path: req.url,
        cacheKey,
      });

      // 重建响应对象
      const response = new NextResponse(cachedResponse.body, {
        status: cachedResponse.status,
        headers: new Headers(cachedResponse.headers),
      });

      // 添加缓存命中标头
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Key', cacheKey);

      return response;
    }

    logPerformance('api.cache.miss', Date.now() - startTime, {
      path: req.url,
      cacheKey,
    });

    // 执行原始处理器
    const response = await handler(req);

    // 只缓存成功响应
    if (response.status >= 200 && response.status < 300) {
      // 异步缓存响应
      cacheResponse(cacheKey, response, options.ttl || CacheTTL.API_RESPONSE.LIST).catch(
        (error) => {
          log.warn('Failed to cache API response', { error, cacheKey });
        }
      );
    }

    // 添加缓存未命中标头
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Cache-Key', cacheKey);

    return response;
  };
}

/**
 * 缓存响应数据结构
 */
interface CachedResponse {
  body: string;
  status: number;
  headers: Record<string, string>;
  cachedAt: number;
}

/**
 * 生成缓存键
 */
function generateCacheKey(req: NextRequest, options: CacheOptions): string {
  if (options.key) {
    return options.key;
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname;

  // 基础缓存键
  let keyParts = [method, pathname];

  // 添加查询参数
  const searchParams = url.searchParams;
  const sortedParams = Array.from(searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  if (sortedParams) {
    keyParts.push(sortedParams);
  }

  // 添加变化因子
  if (options.varyBy) {
    for (const vary of options.varyBy) {
      const value = req.headers.get(vary);
      if (value) {
        keyParts.push(`${vary}:${value}`);
      }
    }
  }

  // 生成哈希键
  const keyString = keyParts.join(':');
  const hash = crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);

  return CacheKeys.API.RESPONSE(method, pathname, hash);
}

/**
 * 缓存响应
 */
async function cacheResponse(
  key: string,
  response: NextResponse,
  ttl: number
): Promise<void> {
  // 读取响应体
  const body = await response.text();

  // 提取必要的头信息
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    // 不缓存某些头信息
    if (!['set-cookie', 'x-cache', 'x-cache-key'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  const cachedResponse: CachedResponse = {
    body,
    status: response.status,
    headers,
    cachedAt: Date.now(),
  };

  await cache.set(key, cachedResponse, ttl);
}

/**
 * 条件缓存 - 只缓存 GET 请求
 */
export const cacheOnlyGET = (req: NextRequest) => req.method === 'GET';

/**
 * 条件缓存 - 只缓存认证用户
 */
export const cacheOnlyAuthenticated = (req: NextRequest) =>
  req.headers.has('authorization') || req.cookies.has('token');

/**
 * 创建自定义缓存配置
 */
export function createCacheConfig(config: Partial<CacheOptions>): CacheOptions {
  return {
    ttl: CacheTTL.API_RESPONSE.LIST,
    condition: cacheOnlyGET,
    ...config,
  };
}

/**
 * 预定义的缓存配置
 */
export const CacheConfigs = {
  // 短期缓存（5分钟）
  SHORT: createCacheConfig({
    ttl: CacheTTL.SHORT,
  }),

  // 中期缓存（30分钟）
  MEDIUM: createCacheConfig({
    ttl: CacheTTL.MEDIUM,
  }),

  // 长期缓存（2小时）
  LONG: createCacheConfig({
    ttl: CacheTTL.LONG,
  }),

  // 列表数据缓存
  LIST: createCacheConfig({
    ttl: CacheTTL.API_RESPONSE.LIST,
    varyBy: ['x-enterprise-id'],
  }),

  // 详情数据缓存
  DETAIL: createCacheConfig({
    ttl: CacheTTL.API_RESPONSE.DETAIL,
  }),

  // 统计数据缓存
  STATS: createCacheConfig({
    ttl: CacheTTL.API_RESPONSE.STATS,
    varyBy: ['x-enterprise-id', 'x-department-id'],
  }),

  // 配置数据缓存
  CONFIG: createCacheConfig({
    ttl: CacheTTL.API_RESPONSE.CONFIG,
  }),
};