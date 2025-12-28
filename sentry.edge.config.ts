import * as Sentry from '@sentry/nextjs';

// Sentry Edge Runtime 配置
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

  // Edge Runtime 不支持某些 Node.js 特定的集成
  integrations: [
    // HTTP 追踪
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // 发送前处理
  beforeSend(event, hint) {
    // Edge Runtime 特定的上下文
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'edge',
      },
    };

    // 移除敏感信息
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }

    return event;
  },
});