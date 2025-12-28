import * as Sentry from '@sentry/nextjs';

// Sentry 客户端配置
Sentry.init({
  // DSN 从环境变量读取
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 环境设置
  environment: process.env.NODE_ENV || 'development',

  // 错误采样率 (0.0 到 1.0)
  // 生产环境建议设置为 0.1-0.5
  sampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // 性能监控采样率
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 重放会话采样率
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 调试模式（仅在开发环境开启）
  debug: false, // 关闭调试避免干扰

  // 忽略特定错误
  ignoreErrors: [
    // 忽略浏览器扩展引起的错误
    /chrome-extension/,
    /firefox-extension/,
    // 忽略常见的网络错误
    'NetworkError',
    'Network request failed',
    // 忽略用户取消的操作
    'AbortError',
    // 忽略非关键的 ResizeObserver 错误
    'ResizeObserver loop limit exceeded',
  ],

  // 集成配置 - 使用新的 API
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // 发送前处理
  beforeSend(event, hint) {
    // 在开发环境下，同时在控制台打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      console.error('Error Hint:', hint);
    }

    // 过滤敏感信息
    if (event.request) {
      // 移除认证信息
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      // 移除敏感查询参数
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]+/g,
          'token=***'
        );
      }
    }

    // 添加用户上下文（如果有）
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          event.user = {
            id: user.id,
            email: user.email,
            username: user.name,
          };
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    return event;
  },

  // 面包屑配置
  beforeBreadcrumb(breadcrumb) {
    // 过滤掉某些类型的面包屑
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }

    // 限制消息长度
    if (breadcrumb.message && breadcrumb.message.length > 200) {
      breadcrumb.message = breadcrumb.message.substring(0, 200) + '...';
    }

    return breadcrumb;
  },
});

// 设置初始用户上下文
export function setUserContext(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  enterpriseId?: string | null;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  Sentry.setContext('user_details', {
    role: user.role,
    enterpriseId: user.enterpriseId,
  });
}

// 清除用户上下文
export function clearUserContext() {
  Sentry.setUser(null);
}
