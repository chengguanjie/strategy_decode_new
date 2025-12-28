
import type { NextRequest, NextResponse } from 'next/server';
import { cache, CacheTTL } from '@/lib/redis';
import { successResponse, type ApiResponse } from '@/lib/api-response';

export interface ApiCacheOptions {
                  /**
                   * 缓存键
                   * 建议使用 CacheKeys.API.RESPONSE 或自定义包含 user:|enterprise:|department:|strategy: 的键以启用自动标签失效
                   */
                  key: string;
                  /**
                   * 过期时间（秒），默认使用 CacheTTL.API_RESPONSE.LIST (5分钟)
                   */
                  ttl?: number;
}

/**
 * API 响应缓存包装器
 * 用于包装 API 处理逻辑，实现自动缓存读取和写入
 * 
 * @example
 * export async function GET(req: NextRequest) {
 *   return cachedApiResponse(
 *     { key: `api:enterprise:list` },
 *     async () => {
 *       const data = await prisma.enterprise.findMany();
 *       return data; // 返回纯数据，而不是 Response 对象
 *     }
 *   );
 * }
 */
export async function cachedApiResponse<T>(
                  options: ApiCacheOptions,
                  fetchData: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
                  const { key, ttl = CacheTTL.API_RESPONSE.LIST } = options;

                  try {
                                    // 1. 尝试读取缓存
                                    const cached = await cache.get<T>(key);
                                    if (cached) {
                                                      // 可以在此处添加 X-Cache 响应头，但需要修改 api-response 结构
                                                      // 目前仅从 successResponse 返回
                                                      return successResponse(cached);
                                    }
                  } catch (error) {
                                    // 缓存读取失败不应阻断业务
                                    console.warn('[ApiCache] Read failed:', error);
                  }

                  // 2. 执行业务逻辑
                  const data = await fetchData();

                  // 3. 写入缓存 (异步执行，不阻塞响应)
                  // 注意：我们缓存的是原始数据 data，而不是 NextResponse 对象
                  cache.set(key, data, ttl).catch(err => {
                                    console.warn('[ApiCache] Write failed:', err);
                  });

                  return successResponse(data);
}

/**
 * 生成基于请求 URL 的缓存键
 * @param req NextRequest
 * @param prefix 自定义前缀，默认为 'api'
 * @example api:GET:api:enterprises:page=1&size=10
 */
export function generateRequestCacheKey(req: NextRequest, prefix: string = 'api'): string {
                  const url = new URL(req.url);
                  const method = req.method;
                  const path = url.pathname.replace(/\//g, ':'); // /api/enterprises -> :api:enterprises

                  const searchParams = new URLSearchParams(url.search);
                  searchParams.sort(); // 确保参数顺序一致
                  const queryString = searchParams.toString();

                  return `${prefix}:${method}${path}${queryString ? `:${queryString}` : ''}`;
}
