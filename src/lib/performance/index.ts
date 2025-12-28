/**
 * 性能监控模块
 * 提供应用程序性能监控功能
 */

export { performanceMonitor, PerformanceMonitor } from './monitor';
export type { PerformanceMetrics, PerformanceThresholds } from './monitor';

export { Performance, PerformanceSync, MonitorClass } from './decorators';
export type { PerformanceOptions } from './decorators';

export { withPerformanceMonitoring, createMonitoredHandler } from './api-monitor';

/**
 * 便捷的性能监控函数
 */
export const perf = {
  /**
   * 监控异步函数执行
   */
  async monitor<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const { performanceMonitor } = await import('./monitor');
    return performanceMonitor.monitor(operation, fn, metadata);
  },

  /**
   * 监控同步函数执行
   */
  monitorSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const { performanceMonitor } = require('./monitor');
    return performanceMonitor.monitorSync(operation, fn, metadata);
  },

  /**
   * 开始性能计时
   */
  start(operation: string, metadata?: Record<string, any>) {
    const { performanceMonitor } = require('./monitor');
    return performanceMonitor.start(operation, metadata);
  },
};