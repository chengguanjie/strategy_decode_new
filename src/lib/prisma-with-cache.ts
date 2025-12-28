import { PrismaClient } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '@/lib/redis';
import { log } from '@/lib/logger';

/**
 * 创建带缓存的 Prisma 客户端
 */
export function createPrismaWithCache() {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // 缓存中间件 - 拦截查询操作
  prisma.$use(async (params, next) => {
    // 只缓存查询操作
    const cacheableOperations = ['findUnique', 'findFirst', 'findMany'];
    if (!cacheableOperations.includes(params.action)) {
      return next(params);
    }

    // 生成缓存键
    const cacheKey = generateCacheKey(params);
    if (!cacheKey) {
      return next(params);
    }

    // 尝试从缓存获取
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult !== null) {
      log.debug('Prisma cache hit', { model: params.model, action: params.action });
      return cachedResult;
    }

    // 执行查询
    const result = await next(params);

    // 写入缓存
    const ttl = getCacheTTL(params.model || '');
    if (ttl > 0) {
      await cache.set(cacheKey, result, ttl).catch((error) => {
        log.warn('Failed to cache Prisma result', { error, cacheKey });
      });
    }

    return result;
  });

  // 自动失效缓存中间件 - 拦截写操作
  prisma.$use(async (params, next) => {
    const mutationOperations = ['create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];
    if (!mutationOperations.includes(params.action)) {
      return next(params);
    }

    // 执行操作
    const result = await next(params);

    // 失效相关缓存
    await invalidateModelCache(params.model || '');

    return result;
  });

  return prisma;
}

/**
 * 生成缓存键
 */
function generateCacheKey(params: any): string | null {
  const { model, action, args } = params;

  if (!model) return null;

  // 根据不同的操作生成不同的缓存键
  switch (action) {
    case 'findUnique':
      if (args.where?.id) {
        return `prisma:${model}:id:${args.where.id}`;
      }
      if (args.where?.email) {
        return `prisma:${model}:email:${args.where.email}`;
      }
      break;

    case 'findFirst':
    case 'findMany':
      // 对查询参数进行序列化，生成唯一键
      const queryKey = JSON.stringify({
        where: args.where || {},
        orderBy: args.orderBy || {},
        take: args.take,
        skip: args.skip,
        select: args.select,
        include: args.include,
      });
      return `prisma:${model}:query:${Buffer.from(queryKey).toString('base64')}`;
  }

  return null;
}

/**
 * 获取模型的缓存 TTL
 */
function getCacheTTL(model: string): number {
  const ttlMap: Record<string, number> = {
    User: CacheTTL.DB_QUERY.USER,
    Enterprise: CacheTTL.DB_QUERY.ENTERPRISE,
    Department: CacheTTL.DB_QUERY.DEPARTMENT,
    Strategy: CacheTTL.DB_QUERY.STRATEGY,
    MarketSelection: CacheTTL.DB_QUERY.STRATEGY,
    DashboardCard: CacheTTL.MEDIUM,
    CustomerStructureData: CacheTTL.MEDIUM,
    StrategyTableData: CacheTTL.SHORT,
  };

  return ttlMap[model] || CacheTTL.SHORT;
}

/**
 * 失效模型相关的缓存
 */
async function invalidateModelCache(model: string): Promise<void> {
  try {
    // 删除该模型的所有查询缓存
    await cache.deleteMany(`prisma:${model}:*`);

    // 根据模型类型失效相关标签
    switch (model) {
      case 'User':
        await cache.invalidateByTag('tag:user');
        break;
      case 'Enterprise':
        await cache.invalidateByTag('tag:enterprise');
        break;
      case 'Department':
        await cache.invalidateByTag('tag:department');
        break;
      case 'Strategy':
      case 'MarketSelection':
      case 'StrategyFramework':
      case 'WinningPoint':
      case 'ActionPlan':
      case 'KeyMetric':
        await cache.invalidateByTag('tag:strategy');
        break;
      case 'DashboardCard':
      case 'DepartmentMetricTrend':
        await cache.invalidateByTag('tag:dashboard');
        break;
    }

    log.debug('Model cache invalidated', { model });
  } catch (error) {
    log.warn('Failed to invalidate model cache', { error, model });
  }
}

// 导出带缓存的 Prisma 实例
export const prismaWithCache = createPrismaWithCache();