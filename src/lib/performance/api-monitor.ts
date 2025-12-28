import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './monitor';

/**
 * API性能监控包装器
 * 自动监控API路由的执行时间和资源使用
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  operation?: string
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // 构建操作名称
    const operationName = operation || `api.request.${method}.${pathname.replace(/\//g, '.')}`;

    // 提取有用的元数据
    const metadata = {
      method,
      path: pathname,
      userAgent: request.headers.get('user-agent') || 'unknown',
      contentLength: request.headers.get('content-length'),
      requestId: request.headers.get('x-request-id'),
    };

    // 监控API处理性能
    const response = await performanceMonitor.monitor(
      operationName,
      () => handler(...args),
      metadata
    );

    return response;
  }) as T;
}

/**
 * 创建性能监控的API路由处理器
 */
export function createMonitoredHandler(
  handlers: {
    GET?: (req: NextRequest) => Promise<NextResponse>;
    POST?: (req: NextRequest) => Promise<NextResponse>;
    PUT?: (req: NextRequest) => Promise<NextResponse>;
    DELETE?: (req: NextRequest) => Promise<NextResponse>;
    PATCH?: (req: NextRequest) => Promise<NextResponse>;
  },
  basePath?: string
) {
  const monitoredHandlers: any = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      const operation = basePath
        ? `api.${method.toLowerCase()}.${basePath}`
        : undefined;

      monitoredHandlers[method] = withPerformanceMonitoring(handler, operation);
    }
  }

  return monitoredHandlers;
}