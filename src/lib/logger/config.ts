import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// 日志级别定义
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// 日志颜色配置
export const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};

// 自定义时间戳格式
const timestampFormat = () => {
  const date = new Date();
  return date.toISOString();
};

// 自定义日志格式
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// 开发环境格式（带颜色）
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: timestampFormat }),
  winston.format.errors({ stack: true }),
  customFormat
);

// 生产环境格式（JSON）
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: timestampFormat }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 日志目录配置
export const logDir = process.env.LOG_DIR || 'logs';

// 文件传输配置
export const fileTransportConfig: DailyRotateFile.DailyRotateFileTransportOptions = {
  dirname: logDir,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat,
};

// 错误日志文件配置
export const errorFileTransportConfig: DailyRotateFile.DailyRotateFileTransportOptions = {
  ...fileTransportConfig,
  filename: 'error-%DATE%.log',
  level: 'error',
};

// 组合日志文件配置
export const combinedFileTransportConfig: DailyRotateFile.DailyRotateFileTransportOptions = {
  ...fileTransportConfig,
  filename: 'combined-%DATE%.log',
};

// HTTP请求日志配置
export const httpFileTransportConfig: DailyRotateFile.DailyRotateFileTransportOptions = {
  ...fileTransportConfig,
  filename: 'http-%DATE%.log',
  level: 'http',
};

// 性能日志配置
export const performanceFileTransportConfig: DailyRotateFile.DailyRotateFileTransportOptions = {
  ...fileTransportConfig,
  filename: 'performance-%DATE%.log',
  level: 'info',
};

// 控制台传输配置
export const consoleTransportConfig: winston.transports.ConsoleTransportOptions = {
  format: isDevelopment ? devFormat : prodFormat,
  silent: isTest,
};

// 根据环境获取日志级别
export const getLogLevel = (): string => {
  if (isTest) return 'error';
  if (isDevelopment) return 'debug';
  return process.env.LOG_LEVEL || 'info';
};

// 日志元数据增强
export interface LogMetadata {
  service?: string;
  userId?: string;
  enterpriseId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  [key: string]: any;
}