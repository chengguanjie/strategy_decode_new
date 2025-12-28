import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheService, CacheKeys, CacheTTL } from '@/lib/redis';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withCache, CacheConfigs } from '@/lib/middleware/cache';

/**
 * Redis 缓存测试端点
 * 仅在开发环境下可用
 */

// GET: 测试缓存功能
export const GET = withCache(
  async (req: NextRequest) => {
    // 仅在开发环境下允许访问
    if (process.env.NODE_ENV !== 'development') {
      return errorResponse('TEST_001', '此端点仅在开发环境下可用', 403);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'test';

    switch (action) {
      case 'test':
        // 基本缓存测试
        const testKey = 'test:cache:basic';
        const testValue = { message: 'Hello from cache', timestamp: Date.now() };

        // 设置缓存
        await cache.set(testKey, testValue, 60);

        // 获取缓存
        const cachedValue = await cache.get(testKey);

        return successResponse({
          message: '缓存测试成功',
          original: testValue,
          cached: cachedValue,
          match: JSON.stringify(testValue) === JSON.stringify(cachedValue),
        });

      case 'getOrSet':
        // 测试 getOrSet 模式
        const key = CacheKeys.API.RESPONSE('GET', '/test', 'demo');
        const result = await cache.getOrSet(
          key,
          async () => {
            // 模拟耗时操作
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              data: 'Expensive computation result',
              computedAt: Date.now(),
            };
          },
          CacheTTL.SHORT
        );

        return successResponse({
          message: 'getOrSet 测试成功',
          result,
          key,
        });

      case 'invalidate':
        // 测试标签失效
        const tag = 'tag:test';
        const keys = [
          'test:tag:1',
          'test:tag:2',
          'test:tag:3',
        ];

        // 设置带标签的缓存
        for (const k of keys) {
          await cache.set(k, { data: k }, 300);
        }

        // 失效标签
        const invalidated = await cache.invalidateByTag(tag);

        return successResponse({
          message: '标签失效测试',
          keysSet: keys,
          invalidated,
        });

      case 'stats':
        // 获取缓存统计
        const stats = await cacheService.getStats();

        return successResponse({
          message: '缓存统计信息',
          stats,
        });

      case 'warmup':
        // 测试缓存预热
        await cacheService.warmup([
          {
            key: 'warmup:test:1',
            fn: async () => ({ data: 'warmup data 1' }),
            ttl: 300,
          },
          {
            key: 'warmup:test:2',
            fn: async () => ({ data: 'warmup data 2' }),
            ttl: 300,
          },
        ]);

        return successResponse({
          message: '缓存预热完成',
          warmedKeys: ['warmup:test:1', 'warmup:test:2'],
        });

      case 'cleanup':
        // 测试清理
        await cacheService.cleanup();

        return successResponse({
          message: '缓存清理完成',
        });

      default:
        return errorResponse('TEST_002', '未知的测试操作', 400);
    }
  },
  CacheConfigs.SHORT // 使用短期缓存配置
);

// POST: 测试缓存失效
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('TEST_001', '此端点仅在开发环境下可用', 403);
  }

  try {
    const body = await req.json();
    const { pattern, tag } = body;

    if (pattern) {
      // 根据模式删除缓存
      const deleted = await cache.deleteMany(pattern);
      return successResponse({
        message: '缓存删除成功',
        pattern,
        deletedCount: deleted,
      });
    }

    if (tag) {
      // 根据标签失效缓存
      const invalidated = await cache.invalidateByTag(tag);
      return successResponse({
        message: '标签失效成功',
        tag,
        invalidatedCount: invalidated,
      });
    }

    return errorResponse('VAL_001', '请提供 pattern 或 tag 参数', 400);
  } catch (error) {
    console.error('Cache test error:', error);
    return errorResponse('TEST_003', '缓存测试失败', 500);
  }
}