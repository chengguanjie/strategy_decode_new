import { Redis } from 'ioredis';
import { createRedisClient, CacheKeys, CacheTTL, getCacheKeyTags, CacheTags } from './config';
import { log, logPerformance } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';
import { trackError } from '@/lib/error-tracking';

/**
 * Redis 缓存服务
 */
export class CacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  /**
   * 获取 Redis 客户端实例
   */
  private async getClient(): Promise<Redis | null> {
    if (!this.client) {
      try {
        this.client = createRedisClient();
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        logPerformance('cache.connection.failed', 0, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        trackError(error, {
          level: 'warning',
          tags: { service: 'redis' },
        }, 'CacheService');
        return null;
      }
    }
    return this.client;
  }

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    return performanceMonitor.monitor(
      'cache.get',
      async () => {
        const client = await this.getClient();
        if (!client) return null;

        try {
          const value = await client.get(key);
          if (!value) {
            log.debug('Cache miss', { key });
            return null;
          }

          log.debug('Cache hit', { key });
          return JSON.parse(value) as T;
        } catch (error) {
          logPerformance('cache.get.error', 0, {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return null;
        }
      },
      { key }
    );
  }

  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return performanceMonitor.monitor(
      'cache.set',
      async () => {
        const client = await this.getClient();
        if (!client) return false;

        try {
          const serialized = JSON.stringify(value);
          const effectiveTTL = ttl || CacheTTL.MEDIUM;

          if (ttl) {
            await client.setex(key, effectiveTTL, serialized);
          } else {
            await client.set(key, serialized);
          }

          // 添加标签关联
          const tags = getCacheKeyTags(key);
          for (const tag of tags) {
            await client.sadd(tag, key);
          }

          log.debug('Cache set', { key, ttl: effectiveTTL });
          return true;
        } catch (error) {
          logPerformance('cache.set.error', 0, {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return false;
        }
      },
      { key, ttl }
    );
  }

  /**
   * 删除缓存值
   */
  async delete(key: string): Promise<boolean> {
    return performanceMonitor.monitor(
      'cache.delete',
      async () => {
        const client = await this.getClient();
        if (!client) return false;

        try {
          const result = await client.del(key);

          // 从标签集合中移除
          const tags = getCacheKeyTags(key);
          for (const tag of tags) {
            await client.srem(tag, key);
          }

          log.debug('Cache deleted', { key, success: result === 1 });
          return result === 1;
        } catch (error) {
          logPerformance('cache.delete.error', 0, {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return false;
        }
      },
      { key }
    );
  }

  /**
   * 批量删除缓存
   */
  async deleteMany(pattern: string): Promise<number> {
    return performanceMonitor.monitor(
      'cache.deleteMany',
      async () => {
        const client = await this.getClient();
        if (!client) return 0;

        try {
          const keys = await client.keys(pattern);
          if (keys.length === 0) return 0;

          const pipeline = client.pipeline();
          for (const key of keys) {
            pipeline.del(key);

            // 从标签集合中移除
            const tags = getCacheKeyTags(key);
            for (const tag of tags) {
              pipeline.srem(tag, key);
            }
          }

          await pipeline.exec();
          log.debug('Cache batch deleted', { pattern, count: keys.length });
          return keys.length;
        } catch (error) {
          logPerformance('cache.deleteMany.error', 0, {
            pattern,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return 0;
        }
      },
      { pattern }
    );
  }

  /**
   * 根据标签失效缓存
   */
  async invalidateByTag(tag: string): Promise<number> {
    return performanceMonitor.monitor(
      'cache.invalidateByTag',
      async () => {
        const client = await this.getClient();
        if (!client) return 0;

        try {
          const keys = await client.smembers(tag);
          if (keys.length === 0) return 0;

          const pipeline = client.pipeline();
          for (const key of keys) {
            pipeline.del(key);
          }
          pipeline.del(tag);

          await pipeline.exec();
          log.info('Cache invalidated by tag', { tag, count: keys.length });
          return keys.length;
        } catch (error) {
          logPerformance('cache.invalidateByTag.error', 0, {
            tag,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return 0;
        }
      },
      { tag }
    );
  }

  /**
   * Cache-Aside Pattern: 先查缓存，未命中则执行函数并缓存结果
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return performanceMonitor.monitor(
      'cache.getOrSet',
      async () => {
        // 先尝试从缓存获取
        const cached = await this.get<T>(key);
        if (cached !== null) {
          return cached;
        }

        // 缓存未命中，执行函数获取数据
        const result = await fn();

        // 异步写入缓存，不阻塞返回
        this.set(key, result, ttl).catch((error) => {
          logPerformance('cache.getOrSet.setError', 0, {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });

        return result;
      },
      { key, ttl }
    );
  }

  /**
   * 使用分布式锁执行操作，防止缓存击穿
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    timeout: number = 5000
  ): Promise<T> {
    const client = await this.getClient();
    if (!client) {
      // Redis 不可用时直接执行
      return fn();
    }

    const lockValue = `${Date.now()}-${Math.random()}`;
    const acquired = await client.set(
      lockKey,
      lockValue,
      'PX',
      timeout,
      'NX'
    );

    if (!acquired) {
      // 未获取到锁，等待重试
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.withLock(lockKey, fn, timeout);
    }

    try {
      return await fn();
    } finally {
      // 确保只删除自己的锁
      const currentValue = await client.get(lockKey);
      if (currentValue === lockValue) {
        await client.del(lockKey);
      }
    }
  }

  /**
   * 缓存预热
   */
  async warmup(keys: Array<{ key: string; fn: () => Promise<unknown>; ttl?: number }>) {
    log.info('Starting cache warmup', { count: keys.length });

    const results = await Promise.allSettled(
      keys.map(async ({ key, fn, ttl }) => {
        const data = await fn();
        return this.set(key, data, ttl);
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    log.info('Cache warmup completed', { successful, failed });
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<Record<string, unknown> | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const info = await client.info('stats');
      const dbSize = await client.dbsize();

      return {
        dbSize,
        info,
        connected: this.isConnected,
      };
    } catch (error) {
      logPerformance('cache.getStats.error', 0, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    const client = await this.getClient();
    if (!client) return;

    try {
      // Redis 自动处理过期键，这里可以执行自定义清理逻辑
      log.info('Running cache cleanup');

      // 清理空的标签集合
      for (const tag of Object.values(CacheTags)) {
        const size = await client.scard(tag);
        if (size === 0) {
          await client.del(tag);
        }
      }
    } catch (error) {
      logPerformance('cache.cleanup.error', 0, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 关闭 Redis 连接
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      log.info('Redis connection closed');
    }
  }
}

// 导出单例实例
export const cacheService = new CacheService();

// 导出配置和工具
export { CacheKeys, CacheTTL, CacheTags } from './config';

// 导出便捷方法
export const cache = {
  get: <T>(key: string) => cacheService.get<T>(key),
  set: <T>(key: string, value: T, ttl?: number) => cacheService.set(key, value, ttl),
  delete: (key: string) => cacheService.delete(key),
  deleteMany: (pattern: string) => cacheService.deleteMany(pattern),
  getOrSet: <T>(key: string, fn: () => Promise<T>, ttl?: number) =>
    cacheService.getOrSet(key, fn, ttl),
  invalidateByTag: (tag: string) => cacheService.invalidateByTag(tag),
};