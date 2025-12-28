import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { performanceMonitor } from '@/lib/performance/monitor';
import { withPerformanceMonitoring } from '@/lib/performance/api-monitor';

/**
 * 获取性能监控报告
 * 仅在开发环境下可用
 */
export const GET = withPerformanceMonitoring(
  async (req: NextRequest) => {
    // 仅在开发环境下允许访问
    if (process.env.NODE_ENV !== 'development') {
      return errorResponse('PERF_001', '性能报告仅在开发环境下可用', 403);
    }

    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation');
      const action = searchParams.get('action');

      // 根据操作类型执行不同的动作
      if (action === 'clear') {
        performanceMonitor.clear();
        return successResponse(
          {
            message: '性能指标已清除',
            timestamp: new Date().toISOString(),
          },
          200
        );
      }

      // 获取性能报告
      if (operation) {
        // 获取特定操作的统计信息
        const stats = performanceMonitor.getStats(operation);
        return successResponse(
          {
            operation,
            stats,
            timestamp: new Date().toISOString(),
          },
          200
        );
      } else {
        // 获取完整的性能报告
        const report = performanceMonitor.generateReport();
        return successResponse(report, 200);
      }
    } catch (error) {
      return errorResponse('PERF_002', '获取性能报告失败', 500);
    }
  },
  'api.performance.report'
);