import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { log, logAudit, logPerformance, logError, logSecurity } from '@/lib/logger';

/**
 * 日志系统测试端点
 * 仅在开发环境下可用
 */
export async function GET(req: NextRequest) {
  // 仅在开发环境下允许访问
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('TEST_001', '此端点仅在开发环境下可用', 403);
  }

  try {
    const startTime = Date.now();

    // 测试各种日志级别
    log.info('日志系统测试开始');
    log.debug('Debug 级别日志测试', { test: true });
    log.warn('Warning 级别日志测试', { level: 'warn' });

    // 测试审计日志
    logAudit('test-action', 'test-user-123', 'test-resource', 'success', {
      action: '测试审计日志',
    });

    // 测试性能日志
    const operationTime = Date.now() - startTime;
    logPerformance('test-operation', operationTime, {
      operation: '日志测试',
    });

    // 测试安全日志
    logSecurity('Test Security Event', 'low', {
      event: '测试安全事件',
    });

    // 测试错误日志
    try {
      throw new Error('测试错误');
    } catch (error) {
      logError(error, 'Test Context', { handled: true });
    }

    log.info('日志系统测试完成');

    return successResponse(
      {
        message: '日志系统测试成功',
        logDir: process.env.LOG_DIR || 'logs',
        logLevel: process.env.LOG_LEVEL || 'info',
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    logError(error, 'Test Logger Endpoint');
    return errorResponse('TEST_002', '日志系统测试失败', 500);
  }
}