import { performanceMonitor } from './monitor';

/**
 * 性能监控装饰器选项
 */
export interface PerformanceOptions {
  operation?: string;
  metadata?: Record<string, any>;
}

/**
 * 方法性能监控装饰器
 * 用于监控类方法的执行性能
 */
export function Performance(options?: PerformanceOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operation = options?.operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      // 合并元数据
      const metadata = {
        ...options?.metadata,
        method: propertyKey,
        class: target.constructor.name,
        argsLength: args.length,
      };

      // 使用性能监控器监控方法执行
      return performanceMonitor.monitor(
        operation,
        () => originalMethod.apply(this, args),
        metadata
      );
    };

    return descriptor;
  };
}

/**
 * 同步方法性能监控装饰器
 */
export function PerformanceSync(options?: PerformanceOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operation = options?.operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      // 合并元数据
      const metadata = {
        ...options?.metadata,
        method: propertyKey,
        class: target.constructor.name,
        argsLength: args.length,
      };

      // 使用性能监控器监控方法执行
      return performanceMonitor.monitorSync(
        operation,
        () => originalMethod.apply(this, args),
        metadata
      );
    };

    return descriptor;
  };
}

/**
 * 类性能监控装饰器
 * 自动监控类中的所有方法
 */
export function MonitorClass(prefix?: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    const className = prefix || constructor.name;

    // 获取原型上的所有方法
    const prototype = constructor.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const propertyName of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);

      // 跳过构造函数和非方法属性
      if (propertyName === 'constructor' || !descriptor || typeof descriptor.value !== 'function') {
        continue;
      }

      const originalMethod = descriptor.value;
      const operation = `${className}.${propertyName}`;

      // 判断是否为异步方法
      const isAsync = originalMethod.constructor.name === 'AsyncFunction';

      if (isAsync) {
        descriptor.value = async function (...args: any[]) {
          return performanceMonitor.monitor(
            operation,
            () => originalMethod.apply(this, args),
            { class: className, method: propertyName }
          );
        };
      } else {
        descriptor.value = function (...args: any[]) {
          return performanceMonitor.monitorSync(
            operation,
            () => originalMethod.apply(this, args),
            { class: className, method: propertyName }
          );
        };
      }

      Object.defineProperty(prototype, propertyName, descriptor);
    }

    return constructor;
  };
}