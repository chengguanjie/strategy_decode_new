import { Redis } from 'ioredis';
import { log, logError } from '@/lib/logger';

/**
 * Redis 连接配置
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'strategy-performance:',
  retryStrategy: (times: number) => {
    const maxRetryTime = 1000 * 60 * 5; // 5 分钟
    const delay = Math.min(times * 50, 2000);
    if (times * delay > maxRetryTime) {
      return null; // 停止重试
    }
    return delay;
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  lazyConnect: true,
};

/**
 * 缓存 TTL 配置（秒）
 */
export const CacheTTL = {
  // 短期缓存（5分钟）
  SHORT: 5 * 60,

  // 中期缓存（30分钟）
  MEDIUM: 30 * 60,

  // 长期缓存（2小时）
  LONG: 2 * 60 * 60,

  // 超长期缓存（24小时）
  EXTRA_LONG: 24 * 60 * 60,

  // 会话缓存（1小时）
  SESSION: 60 * 60,

  // API 响应缓存
  API_RESPONSE: {
    LIST: 5 * 60,      // 列表数据 5分钟
    DETAIL: 10 * 60,   // 详情数据 10分钟
    STATS: 15 * 60,    // 统计数据 15分钟
    CONFIG: 30 * 60,   // 配置数据 30分钟
  },

  // 数据库查询缓存
  DB_QUERY: {
    USER: 10 * 60,         // 用户数据 10分钟
    ENTERPRISE: 30 * 60,   // 企业数据 30分钟
    DEPARTMENT: 15 * 60,   // 部门数据 15分钟
    STRATEGY: 5 * 60,      // 战略数据 5分钟（更新频繁）
  },
} as const;

/**
 * 缓存键命名规范
 */
export const CacheKeys = {
  // 用户相关
  USER: {
    BY_ID: (id: string) => `user:id:${id}`,
    BY_EMAIL: (email: string) => `user:email:${email}`,
    SESSION: (userId: string) => `session:${userId}`,
  },

  // 企业相关
  ENTERPRISE: {
    LIST: () => 'enterprise:list',
    BY_ID: (id: string) => `enterprise:id:${id}`,
    USERS: (enterpriseId: string) => `enterprise:${enterpriseId}:users`,
    DEPARTMENTS: (enterpriseId: string) => `enterprise:${enterpriseId}:departments`,
  },

  // 部门相关
  DEPARTMENT: {
    BY_ID: (id: string) => `department:id:${id}`,
    BY_ENTERPRISE: (enterpriseId: string) => `departments:enterprise:${enterpriseId}`,
    MEMBERS: (departmentId: string) => `department:${departmentId}:members`,
  },

  // 战略相关
  STRATEGY: {
    LIST: (enterpriseId: string, filters?: string) =>
      `strategy:list:${enterpriseId}${filters ? `:${filters}` : ''}`,
    BY_ID: (id: string) => `strategy:id:${id}`,
    BY_DEPARTMENT: (departmentId: string) => `strategies:department:${departmentId}`,
  },

  // API 响应缓存
  API: {
    RESPONSE: (method: string, path: string, params?: string) =>
      `api:${method}:${path.replace(/\//g, ':')}${params ? `:${params}` : ''}`,
  },

  // 性能指标
  PERFORMANCE: {
    STATS: (operation: string) => `perf:stats:${operation}`,
    DAILY: (date: string) => `perf:daily:${date}`,
  },

  // 临时锁
  LOCK: {
    OPERATION: (operation: string, id: string) => `lock:${operation}:${id}`,
  },
} as const;

/**
 * 创建 Redis 客户端
 */
export function createRedisClient(): Redis {
  const client = new Redis(redisConfig);

  client.on('connect', () => {
    log.info('Redis client connected successfully');
  });

  client.on('error', (error) => {
    logError(error, 'Redis Client');
  });

  client.on('ready', () => {
    log.info('Redis client ready to receive commands');
  });

  client.on('close', () => {
    log.warn('Redis client connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    log.info(`Redis client reconnecting in ${delay}ms`);
  });

  return client;
}

/**
 * 缓存标签系统 - 用于批量失效
 */
export const CacheTags = {
  USER: 'tag:user',
  ENTERPRISE: 'tag:enterprise',
  DEPARTMENT: 'tag:department',
  STRATEGY: 'tag:strategy',
  DASHBOARD: 'tag:dashboard',
} as const;

/**
 * 获取缓存键的标签
 */
export function getCacheKeyTags(key: string): string[] {
  const tags: string[] = [];

  if (key.includes('user:')) tags.push(CacheTags.USER);
  if (key.includes('enterprise:')) tags.push(CacheTags.ENTERPRISE);
  if (key.includes('department:')) tags.push(CacheTags.DEPARTMENT);
  if (key.includes('strategy:')) tags.push(CacheTags.STRATEGY);
  if (key.includes('dashboard')) tags.push(CacheTags.DASHBOARD);

  return tags;
}