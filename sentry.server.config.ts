import * as Sentry from '@sentry/nextjs';

// Sentry 服务端配置
Sentry.init({
  // DSN 从环境变量读取
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 环境设置
  environment: process.env.NODE_ENV || 'development',

  // 错误采样率
  sampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // 性能监控采样率
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 调试模式
  debug: process.env.NODE_ENV === 'development',

  // 集成配置
  integrations: [
    // Prisma 集成
    new Sentry.Integrations.Prisma({
      client: require('@prisma/client').PrismaClient,
    }),
    // HTTP 集成
    new Sentry.Integrations.Http({ tracing: true }),
    // 请求数据集成
    new Sentry.Integrations.RequestData({
      // 包含请求数据
      include: {
        data: true,
        headers: true,
        query_string: true,
        url: true,
        user: true,
      },
      // 不包含的键
      transactionNamingScheme: 'path',
    }),
  ],

  // 忽略特定错误
  ignoreErrors: [
    // Prisma 已知错误
    'PrismaClientKnownRequestError',
    // Next.js 特定错误
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],

  // 发送前处理
  beforeSend(event, hint) {
    // 增强错误信息
    const error = hint.originalException;

    // 处理 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      event.fingerprint = ['prisma', error.code as string];
      event.tags = {
        ...event.tags,
        prisma_error_code: error.code as string,
      };
    }

    // 移除敏感信息
    if (event.request) {
      // 移除认证头
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // 清理请求体中的敏感字段
      if (event.request.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        sensitiveFields.forEach((field) => {
          if (event.request!.data && field in event.request!.data) {
            event.request!.data[field] = '***REDACTED***';
          }
        });
      }
    }

    // 添加额外的服务器上下文
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'Node.js',
        version: process.version,
      },
      app: {
        app_start_time: new Date().toISOString(),
        app_memory: process.memoryUsage(),
      },
    };

    return event;
  },

  // 追踪处理器
  tracesSampler(samplingContext) {
    // 对不同的操作使用不同的采样率
    if (samplingContext.transactionContext.name.includes('/api/auth')) {
      // 认证相关 API 100% 采样
      return 1.0;
    } else if (samplingContext.transactionContext.name.includes('/api/health')) {
      // 健康检查 API 不采样
      return 0;
    } else if (samplingContext.transactionContext.name.includes('/_next')) {
      // Next.js 内部路由降低采样率
      return 0.01;
    }

    // 默认采样率
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});

// 增强的错误捕获函数
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: {
      id: string;
      email?: string;
      username?: string;
    };
    level?: Sentry.SeverityLevel;
  }
) {
  // 设置上下文
  if (context?.user) {
    Sentry.setUser(context.user);
  }

  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  if (context?.extra) {
    Sentry.setExtras(context.extra);
  }

  // 捕获异常
  return Sentry.captureException(error, {
    level: context?.level || 'error',
  });
}

// 性能追踪
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}