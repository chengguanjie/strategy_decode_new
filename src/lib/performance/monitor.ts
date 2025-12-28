import { performanceLogger } from '../logger';

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  metadata?: Record<string, any>;
}

/**
 * 性能阈值配置
 */
export interface PerformanceThresholds {
  warning: number;  // 警告阈值（毫秒）
  critical: number; // 严重阈值（毫秒）
}

/**
 * 默认性能阈值
 */
const DEFAULT_THRESHOLDS: Record<string, PerformanceThresholds> = {
  'api.request': { warning: 1000, critical: 3000 },
  'database.query': { warning: 100, critical: 500 },
  'auth.verify': { warning: 50, critical: 200 },
  'file.operation': { warning: 500, critical: 2000 },
  default: { warning: 500, critical: 1500 },
};

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;

  /**
   * 开始性能监控
   */
  start(operation: string, metadata?: Record<string, any>): () => void {
    const startTime = Date.now();
    const startCpuUsage = process.cpuUsage();
    const startMemory = process.memoryUsage();

    // 返回结束函数
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const endMemory = process.memoryUsage();

      const metrics: PerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration,
        cpuUsage: endCpuUsage,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        metadata,
      };

      this.record(metrics);
    };
  }

  /**
   * 异步操作性能监控
   */
  async monitor<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const end = this.start(operation, metadata);
    try {
      const result = await fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  /**
   * 同步操作性能监控
   */
  monitorSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const end = this.start(operation, metadata);
    try {
      const result = fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  /**
   * 记录性能指标
   */
  private record(metrics: PerformanceMetrics): void {
    // 添加到内存指标列表
    this.metrics.push(metrics);

    // 限制内存中的指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 检查性能阈值
    const thresholds = this.getThresholds(metrics.operation);
    let severity: 'info' | 'warning' | 'critical' = 'info';

    if (metrics.duration >= thresholds.critical) {
      severity = 'critical';
    } else if (metrics.duration >= thresholds.warning) {
      severity = 'warning';
    }

    // 记录到日志
    performanceLogger.log(severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info',
      `Performance: ${metrics.operation} completed in ${metrics.duration}ms`, {
      operation: metrics.operation,
      duration: metrics.duration,
      severity,
      memoryDelta: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
      ...metrics.metadata,
    });
  }

  /**
   * 获取操作的性能阈值
   */
  private getThresholds(operation: string): PerformanceThresholds {
    // 查找匹配的阈值配置
    for (const [pattern, thresholds] of Object.entries(DEFAULT_THRESHOLDS)) {
      if (operation.startsWith(pattern)) {
        return thresholds;
      }
    }
    return DEFAULT_THRESHOLDS.default;
  }

  /**
   * 获取性能统计信息
   */
  getStats(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const filtered = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
      };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      count: durations.length,
      avgDuration: Math.round(sum / durations.length),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
    };
  }

  /**
   * 清除性能指标
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * 获取所有操作类型
   */
  getOperations(): string[] {
    const operations = new Set(this.metrics.map(m => m.operation));
    return Array.from(operations);
  }

  /**
   * 生成性能报告
   */
  generateReport(): Record<string, any> {
    const operations = this.getOperations();
    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      operations: {},
    };

    for (const operation of operations) {
      report.operations[operation] = this.getStats(operation);
    }

    return report;
  }
}

// 导出全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor();