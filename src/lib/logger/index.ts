import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import {
  logLevels,
  logColors,
  getLogLevel,
  errorFileTransportConfig,
  combinedFileTransportConfig,
  httpFileTransportConfig,
  performanceFileTransportConfig,
  consoleTransportConfig,
  LogMetadata,
} from './config';

// 添加颜色支持
winston.addColors(logColors);

// 创建主日志记录器
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  defaultMeta: { service: 'strategy-decode' },
  transports: [
    // 控制台输出
    new winston.transports.Console(consoleTransportConfig),
    // 错误日志文件
    new DailyRotateFile(errorFileTransportConfig),
    // 组合日志文件
    new DailyRotateFile(combinedFileTransportConfig),
  ],
});

// HTTP 请求日志记录器
export const httpLogger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  defaultMeta: { service: 'strategy-decode-http' },
  transports: [
    new winston.transports.Console({ ...consoleTransportConfig, silent: true }),
    new DailyRotateFile(httpFileTransportConfig),
  ],
});

// 性能日志记录器
export const performanceLogger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  defaultMeta: { service: 'strategy-decode-performance' },
  transports: [
    new winston.transports.Console({ ...consoleTransportConfig, silent: true }),
    new DailyRotateFile(performanceFileTransportConfig),
  ],
});

// 日志工具函数
export const log = {
  error: (message: string, metadata?: LogMetadata) => {
    logger.error(message, metadata);
  },

  warn: (message: string, metadata?: LogMetadata) => {
    logger.warn(message, metadata);
  },

  info: (message: string, metadata?: LogMetadata) => {
    logger.info(message, metadata);
  },

  http: (message: string, metadata?: LogMetadata) => {
    httpLogger.http(message, metadata);
  },

  debug: (message: string, metadata?: LogMetadata) => {
    logger.debug(message, metadata);
  },

  performance: (message: string, metadata?: LogMetadata) => {
    performanceLogger.info(message, metadata);
  },
};

// HTTP 请求日志记录
export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  metadata?: LogMetadata
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  const message = `${method} ${url} ${statusCode} ${duration}ms`;

  httpLogger.log(level, message, {
    method,
    url,
    statusCode,
    duration,
    ...metadata,
  });
};

// 性能日志记录
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: LogMetadata
) => {
  const message = `${operation} completed in ${duration}ms`;

  performanceLogger.info(message, {
    operation,
    duration,
    ...metadata,
  });
};

// 错误日志记录（带堆栈追踪）
export const logError = (
  error: Error | unknown,
  context?: string,
  metadata?: LogMetadata
) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const message = context ? `[${context}] ${errorObj.message}` : errorObj.message;

  logger.error(message, {
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    ...metadata,
  });
};

// 审计日志记录
export const logAudit = (
  action: string,
  userId: string,
  resource: string,
  result: 'success' | 'failure',
  metadata?: LogMetadata
) => {
  const message = `Audit: User ${userId} ${action} on ${resource} - ${result}`;

  logger.info(message, {
    audit: true,
    action,
    userId,
    resource,
    result,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// 安全日志记录
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: LogMetadata
) => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  const message = `Security Event: ${event} (${severity} severity)`;

  logger.log(level, message, {
    security: true,
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// 导出主日志记录器
export default logger;