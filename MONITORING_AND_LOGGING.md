# 监控与日志系统实施文档

## 概述

本文档描述了战略绩效系统中实施的监控与日志系统，包括日志框架集成、性能监控系统和错误追踪配置。

## 1. 日志框架（Winston）

### 1.1 核心功能

- **多级别日志记录**：error, warn, info, http, verbose, debug, silly
- **日志轮转**：使用 winston-daily-rotate-file 自动按日期轮转日志
- **格式化输出**：开发环境彩色输出，生产环境 JSON 格式
- **多种日志记录器**：主日志、HTTP 日志、性能日志

### 1.2 主要文件

- `/src/lib/logger/config.ts` - 日志配置
- `/src/lib/logger/index.ts` - 日志服务和工具函数
- `/src/lib/middleware/request-logger.ts` - HTTP 请求日志中间件

### 1.3 使用示例

```typescript
import { log, logAudit, logPerformance, logError } from '@/lib/logger';

// 基本日志
log.info('用户登录成功', { userId: '123' });
log.error('数据库连接失败', { error: 'Connection timeout' });

// 审计日志
logAudit('login', userId, 'user-auth', 'success', {
  email: user.email,
  role: user.role,
});

// 性能日志
logPerformance('database.query', 150, {
  query: 'SELECT * FROM users',
});

// 错误日志
logError(error, 'API Handler', { endpoint: '/api/users' });
```

### 1.4 日志文件结构

```
logs/
├── error-2025-01-01.log      # 错误日志
├── combined-2025-01-01.log   # 综合日志
├── http-2025-01-01.log       # HTTP 请求日志
└── performance-2025-01-01.log # 性能日志
```

## 2. 性能监控系统

### 2.1 核心功能

- **性能指标收集**：执行时间、内存使用、CPU 使用
- **性能阈值监控**：自动警告和报警
- **装饰器支持**：便捷的方法级监控
- **API 性能监控**：自动监控所有 API 路由
- **数据库查询监控**：通过 Prisma 中间件监控

### 2.2 主要文件

- `/src/lib/performance/monitor.ts` - 性能监控核心
- `/src/lib/performance/decorators.ts` - 性能监控装饰器
- `/src/lib/performance/api-monitor.ts` - API 性能监控
- `/src/lib/prisma-with-monitoring.ts` - 带监控的 Prisma 客户端

### 2.3 使用示例

```typescript
import { performanceMonitor, perf, withPerformanceMonitoring, Performance } from '@/lib/performance';

// 1. 直接使用监控
const result = await perf.monitor(
  'complex.operation',
  async () => {
    // 复杂操作
    return await complexCalculation();
  },
  { userId: '123' }
);

// 2. 装饰器方式
class UserService {
  @Performance({ operation: 'user.create' })
  async createUser(data: UserData) {
    // 自动监控此方法的性能
    return await prisma.user.create({ data });
  }
}

// 3. API 路由监控
export const GET = withPerformanceMonitoring(
  async (req: NextRequest) => {
    // API 处理逻辑
    return successResponse(data);
  },
  'api.users.list'
);
```

### 2.4 性能报告

访问 `/api/performance/report` 端点（仅开发环境）获取性能统计：

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "totalMetrics": 245,
  "operations": {
    "api.auth.login": {
      "count": 50,
      "avgDuration": 230,
      "minDuration": 120,
      "maxDuration": 450,
      "p95Duration": 380,
      "p99Duration": 445
    }
  }
}
```

## 3. 错误追踪（Sentry）

### 3.1 核心功能

- **自动错误捕获**：未捕获的异常自动发送到 Sentry
- **手动错误追踪**：支持主动追踪特定错误
- **性能追踪**：集成性能监控数据
- **用户上下文**：自动关联错误与用户信息
- **源码映射**：生产环境错误定位到源代码

### 3.2 主要文件

- `/sentry.client.config.ts` - 客户端 Sentry 配置
- `/sentry.server.config.ts` - 服务端 Sentry 配置
- `/sentry.edge.config.ts` - Edge Runtime 配置
- `/src/lib/error-tracking/index.ts` - 错误追踪集成

### 3.3 使用示例

```typescript
import { trackError, trackMessage, withErrorTracking } from '@/lib/error-tracking';

// 1. 手动追踪错误
try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    level: 'error',
    tags: { operation: 'risky' },
    extra: { input: data },
    user: { id: userId, email: userEmail },
  });
}

// 2. 追踪消息
trackMessage('重要事件发生', {
  level: 'info',
  tags: { event: 'important' },
});

// 3. API 错误边界
export const POST = withErrorTracking(
  async (req: NextRequest) => {
    // API 逻辑
  },
  { operation: 'api.create', tags: { resource: 'user' } }
);
```

### 3.4 环境变量配置

```env
# Sentry DSN（从 Sentry 控制台获取）
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Sentry 组织和项目（用于源码映射上传）
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# Sentry 认证令牌
SENTRY_AUTH_TOKEN="sntrys_xxx"
```

## 4. 集成特性

### 4.1 统一错误处理

所有错误同时记录到：
- Winston 日志文件（本地存储）
- Sentry（云端错误追踪）
- 性能监控（如果是性能相关错误）

### 4.2 请求追踪

每个请求都有唯一的 `x-request-id`，贯穿：
- HTTP 日志
- 性能监控
- 错误追踪
- 安全日志

### 4.3 监控中间件集成

```typescript
// 在 /src/lib/middleware/security.ts 中
- 自动记录所有 HTTP 请求
- 记录安全事件（限流、CSRF 等）
- 性能监控集成
```

## 5. 测试端点

开发环境下可用的测试端点：

1. **日志测试**：`GET /api/test-logger`
2. **性能报告**：`GET /api/performance/report`
3. **Sentry 测试**：`GET /api/test-sentry?type=error`

## 6. 最佳实践

### 6.1 日志记录

1. 使用适当的日志级别
2. 包含有用的上下文信息
3. 避免记录敏感信息
4. 使用结构化日志（metadata）

### 6.2 性能监控

1. 监控关键操作（数据库查询、外部 API 调用）
2. 设置合理的性能阈值
3. 定期查看性能报告
4. 优化高频低效操作

### 6.3 错误处理

1. 使用自定义错误类
2. 提供有意义的错误消息
3. 包含错误上下文
4. 区分预期错误和意外错误

## 7. 运维指南

### 7.1 日志管理

- 日志自动轮转，保留 14 天
- 定期备份重要日志
- 监控日志文件大小

### 7.2 性能优化

- 定期查看性能报告
- 识别性能瓶颈
- 优化慢查询和 API

### 7.3 错误监控

- 配置 Sentry 警报规则
- 定期查看错误趋势
- 及时修复高频错误

## 8. 故障排查

### 8.1 日志不生成

1. 检查 `LOG_LEVEL` 环境变量
2. 确认日志目录权限
3. 查看控制台错误

### 8.2 性能数据缺失

1. 确认监控装饰器正确使用
2. 检查性能监控是否启用
3. 查看内存限制

### 8.3 Sentry 不工作

1. 验证 DSN 配置
2. 检查网络连接
3. 查看 Sentry 调试日志

## 总结

通过集成 Winston、性能监控和 Sentry，我们建立了一个完整的监控与日志系统，能够：

1. **全面记录**：所有重要事件和错误都被记录
2. **性能可见**：实时了解系统性能状况
3. **快速定位**：通过错误追踪快速定位问题
4. **持续改进**：基于数据优化系统性能

这个系统为战略绩效平台的稳定运行提供了坚实的基础。