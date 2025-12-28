import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { trackError, trackMessage, addBreadcrumb, startTransaction } from '@/lib/error-tracking';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors';

/**
 * Sentry 错误追踪测试端点
 * 仅在开发环境下可用
 */
export async function GET(req: NextRequest) {
  // 仅在开发环境下允许访问
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('TEST_001', '此端点仅在开发环境下可用', 403);
  }

  const { searchParams } = new URL(req.url);
  const testType = searchParams.get('type') || 'all';

  // 开始性能事务
  const transaction = startTransaction('sentry-test', 'test');

  try {
    // 添加面包屑
    addBreadcrumb({
      message: 'Sentry test started',
      category: 'test',
      level: 'info',
      data: { testType },
    });

    switch (testType) {
      case 'error':
        // 测试普通错误
        throw new Error('测试错误: 这是一个故意抛出的错误');

      case 'app-error':
        // 测试应用错误
        throw new AppError('TEST_002', '测试应用错误', 400, {
          testData: '这是额外的错误信息',
        });

      case 'validation':
        // 测试验证错误
        throw new ValidationError('测试验证错误', 'VAL_TEST', {
          field: 'testField',
          value: 'invalidValue',
        });

      case 'database':
        // 测试数据库错误
        throw new DatabaseError('测试数据库连接错误', 'DB_TEST', {
          query: 'SELECT * FROM test',
        });

      case 'message':
        // 测试消息追踪
        trackMessage('测试消息: 这是一个信息级别的消息', {
          level: 'info',
          tags: { test: 'true' },
          extra: { timestamp: new Date().toISOString() },
        });
        break;

      case 'warning':
        // 测试警告
        trackMessage('测试警告: 这是一个警告级别的消息', {
          level: 'warning',
          tags: { test: 'true' },
        });
        break;

      case 'manual':
        // 测试手动错误追踪
        const testError = new Error('手动追踪的测试错误');
        trackError(testError, {
          level: 'error',
          tags: {
            manual: 'true',
            test: 'true',
          },
          extra: {
            description: '这是手动追踪的错误示例',
          },
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        });
        break;

      case 'all':
        // 测试所有类型
        addBreadcrumb({
          message: 'Testing all error types',
          category: 'test',
        });

        // 信息消息
        trackMessage('信息: 测试所有错误类型', { level: 'info' });

        // 警告消息
        trackMessage('警告: 某些测试可能会失败', { level: 'warning' });

        // 手动错误
        trackError(new Error('测试错误（不会中断流程）'), {
          level: 'error',
          tags: { handled: 'true' },
        });

        break;
    }

    transaction?.setStatus('ok');

    return successResponse({
      message: 'Sentry 测试完成',
      testType,
      sentryEnabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    transaction?.setStatus('internal_error');

    // 错误会被自动追踪
    throw error;
  } finally {
    transaction?.finish();
  }
}

/**
 * POST 端点用于测试请求体错误
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('TEST_001', '此端点仅在开发环境下可用', 403);
  }

  try {
    const body = await req.json();

    if (body.triggerError) {
      // 模拟处理错误
      throw new Error(`处理请求时出错: ${body.message || '未知错误'}`);
    }

    return successResponse({
      message: '请求处理成功',
      receivedData: body,
    });
  } catch (error) {
    // 错误会被自动追踪和记录
    throw error;
  }
}