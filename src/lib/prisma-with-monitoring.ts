import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from './performance/monitor';
import { log } from './logger';

const globalForPrisma = globalThis as unknown as {
  prismaWithMonitoring: PrismaClient | undefined;
};

// 创建带监控的 Prisma 客户端
function createPrismaClient() {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  // 查询事件监听（用于详细日志）
  client.$on('query' as never, (e: any) => {
    log.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target,
    });
  });

  // 错误事件监听
  client.$on('error' as never, (e: any) => {
    log.error('Database Error', {
      message: e.message,
      target: e.target,
    });
  });

  // 警告事件监听
  client.$on('warn' as never, (e: any) => {
    log.warn('Database Warning', {
      message: e.message,
      target: e.target,
    });
  });

  // 使用中间件进行性能监控
  client.$use(async (params, next) => {
    const operation = `database.${params.model?.toLowerCase()}.${params.action}`;
    const metadata = {
      model: params.model,
      action: params.action,
    };

    // 监控查询性能
    const result = await performanceMonitor.monitor(
      operation,
      () => next(params),
      metadata
    );

    return result;
  });

  return client;
}

// 创建或复用 Prisma 客户端实例
export const prismaWithMonitoring =
  globalForPrisma.prismaWithMonitoring ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaWithMonitoring = prismaWithMonitoring;
}