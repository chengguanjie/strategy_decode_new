import * as Sentry from '@sentry/nextjs';
import { logError as logToWinston } from '../logger';

/**
 * 错误严重程度级别
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    enterpriseId?: string | null;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: ErrorSeverity;
  fingerprint?: string[];
}

/**
 * 统一的错误追踪函数
 * 同时发送到 Sentry 和日志系统
 */
export function trackError(
  error: Error | unknown,
  context?: ErrorContext,
  logContext?: string
): string | undefined {
  // 转换为 Error 对象
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // 记录到 Winston 日志
  logToWinston(errorObj, logContext || 'Application Error', {
    ...context?.extra,
    severity: context?.level || 'error',
  });

  // 如果 Sentry 未配置，仅使用日志
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return undefined;
  }

  // 设置 Sentry 上下文
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.name,
    });

    Sentry.setContext('user_details', {
      role: context.user.role,
      enterpriseId: context.user.enterpriseId,
    });
  }

  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  if (context?.extra) {
    Sentry.setExtras(context.extra);
  }

  // 设置指纹（用于错误分组）
  const scope = Sentry.getCurrentHub().getScope();
  if (context?.fingerprint) {
    scope?.setFingerprint(context.fingerprint);
  }

  // 转换严重程度级别
  const sentryLevel = mapSeverityToSentry(context?.level || 'error');

  // 捕获到 Sentry
  const eventId = Sentry.captureException(errorObj, {
    level: sentryLevel,
  });

  // 清理作用域
  scope?.clear();

  return eventId;
}

/**
 * 追踪消息（非错误）
 */
export function trackMessage(
  message: string,
  context?: ErrorContext
): string | undefined {
  // 记录到日志
  logToWinston(new Error(message), 'Application Message', {
    ...context?.extra,
    severity: context?.level || 'info',
    isMessage: true,
  });

  // 如果 Sentry 未配置，仅使用日志
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return undefined;
  }

  // 设置上下文
  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  if (context?.extra) {
    Sentry.setExtras(context.extra);
  }

  const sentryLevel = mapSeverityToSentry(context?.level || 'info');

  return Sentry.captureMessage(message, sentryLevel);
}

/**
 * 创建性能事务
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, any>
): Sentry.Transaction | undefined {
  // 如果 Sentry 未配置
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return undefined;
  }

  const transaction = Sentry.startTransaction({
    name,
    op,
    data,
  });

  Sentry.getCurrentHub().getScope()?.setSpan(transaction);

  return transaction;
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  type?: string;
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });
}

/**
 * 映射错误级别到 Sentry
 */
function mapSeverityToSentry(severity: ErrorSeverity): Sentry.SeverityLevel {
  const mapping: Record<ErrorSeverity, Sentry.SeverityLevel> = {
    fatal: 'fatal',
    error: 'error',
    warning: 'warning',
    info: 'info',
    debug: 'debug',
  };

  return mapping[severity] || 'error';
}

/**
 * API 错误边界包装器
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: {
    operation?: string;
    fingerprint?: string[];
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: any[]) => {
    const transaction = options?.operation
      ? startTransaction(options.operation, 'http.server')
      : undefined;

    try {
      const result = await handler(...args);
      transaction?.setStatus('ok');
      return result;
    } catch (error) {
      transaction?.setStatus('internal_error');

      // 追踪错误
      trackError(error, {
        tags: {
          ...options?.tags,
          operation: options?.operation || 'unknown',
        },
        fingerprint: options?.fingerprint,
      });

      throw error;
    } finally {
      transaction?.finish();
    }
  }) as T;
}

/**
 * React 组件错误边界
 */
export class ErrorBoundary extends Sentry.ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 同时记录到我们的日志系统
    trackError(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      level: 'error',
    });

    super.componentDidCatch(error, errorInfo);
  }
}

/**
 * 初始化错误追踪
 */
export function initErrorTracking(): void {
  // 监听未捕获的错误
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      trackError(event.reason, {
        tags: {
          type: 'unhandledRejection',
        },
        extra: {
          promise: event.promise,
        },
      });
    });
  } else {
    // 服务端未捕获错误
    process.on('unhandledRejection', (reason, promise) => {
      trackError(reason, {
        tags: {
          type: 'unhandledRejection',
          runtime: 'node',
        },
        extra: {
          promise: promise.toString(),
        },
      });
    });

    process.on('uncaughtException', (error) => {
      trackError(error, {
        tags: {
          type: 'uncaughtException',
          runtime: 'node',
        },
        level: 'fatal',
      });

      // 优雅关闭
      process.exit(1);
    });
  }
}