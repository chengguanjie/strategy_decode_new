# Design Document: 战略绩效系统诊断与改进

## Overview

本设计文档基于对"战略绩效系统"项目的全面分析，识别出系统在架构设计、代码质量、安全性、数据持久化、状态管理、性能、测试覆盖、API设计和可维护性等方面存在的问题，并提供具体的改进方案。

## Architecture

### 当前架构分析

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │ Components  │  │    Types    │              │
│  │  (app/)     │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────┐            │
│  │              State Management                    │            │
│  │   (useState + localStorage - 无全局状态管理)     │            │
│  └─────────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                        API Routes                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Auth     │  │  Enterprise │  │     AI      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Prisma ORM + MySQL                  │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 识别的架构问题

| 问题编号 | 问题描述 | 严重程度 | 影响范围 |
|---------|---------|---------|---------|
| A-001 | 单一页面组件过大 (enterprise/page.tsx ~750行) | 高 | 可维护性 |
| A-002 | 缺乏全局状态管理，依赖localStorage | 中 | 数据一致性 |
| A-003 | 组件职责不清，StrategyDetail包含多个表格组件逻辑 | 中 | 可扩展性 |
| A-004 | API路由缺乏统一的中间件层 | 中 | 安全性、可维护性 |
| A-005 | 大部分表格数据只存在客户端，无持久化 | 高 | 数据可靠性 |



## Components and Interfaces

### 问题清单

#### 1. 代码质量问题

| 问题编号 | 文件/模块 | 问题描述 | 建议改进 |
|---------|----------|---------|---------|
| CQ-001 | enterprise/page.tsx | 文件过长(~750行)，包含多个功能模块 | 拆分为独立组件 |
| CQ-002 | StrategyDetail.tsx | 大量重复的条件渲染代码 | 使用组件映射表 |
| CQ-003 | AISidebar.tsx | AI模型列表硬编码 | 移至配置文件 |
| CQ-004 | 多个表格组件 | 重复的表格操作逻辑 | 抽取自定义Hook |
| CQ-005 | auth.ts | JWT_SECRET使用默认值 | 强制要求环境变量 |
| CQ-006 | 类型定义 | 部分any类型使用 | 完善类型定义 |

#### 2. 安全性问题

| 问题编号 | 位置 | 问题描述 | 风险等级 | 建议改进 |
|---------|------|---------|---------|---------|
| SEC-001 | auth.ts | JWT_SECRET有默认值，生产环境风险 | 严重 | 移除默认值，强制配置 |
| SEC-002 | API routes | 部分API缺少权限验证 | 高 | 添加统一认证中间件 |
| SEC-003 | localStorage | 敏感配置(API Key)存储在客户端 | 中 | 加密存储或服务端管理 |
| SEC-004 | 输入验证 | API输入验证不完整 | 中 | 使用Zod进行schema验证 |
| SEC-005 | 错误信息 | 错误信息可能泄露系统细节 | 低 | 统一错误响应格式 |

#### 3. 数据持久化问题

| 问题编号 | 数据类型 | 当前存储 | 问题 | 建议改进 |
|---------|---------|---------|------|---------|
| DP-001 | 财务指标数据 | 客户端State | 刷新丢失 | 持久化到数据库 |
| DP-002 | 市场选择数据 | 客户端State | 刷新丢失 | 持久化到数据库 |
| DP-003 | 价值竞争数据 | 客户端State | 刷新丢失 | 持久化到数据库 |
| DP-004 | 部门战略数据 | 客户端State | 刷新丢失 | 持久化到数据库 |
| DP-005 | AI聊天历史 | localStorage | 容量限制、跨设备不同步 | 可选持久化到数据库 |
| DP-006 | AI配置 | localStorage | 跨设备不同步 | 持久化到数据库 |

#### 4. 前端状态管理问题

| 问题编号 | 问题描述 | 影响 | 建议改进 |
|---------|---------|------|---------|
| SM-001 | 过度依赖localStorage | 数据不一致、容量限制 | 引入状态管理库 |
| SM-002 | 组件间状态传递复杂 | 代码复杂度高 | 使用Context或Zustand |
| SM-003 | 缺乏数据缓存策略 | 重复请求 | 使用SWR或React Query |
| SM-004 | 表单状态分散 | 难以统一管理 | 使用React Hook Form |

#### 5. 性能问题

| 问题编号 | 位置 | 问题描述 | 建议改进 |
|---------|------|---------|---------|
| PF-001 | StrategyDetail | 每次切换重新渲染所有表格 | 使用React.memo |
| PF-002 | AISidebar | 消息列表无虚拟滚动 | 大量消息时添加虚拟滚动 |
| PF-003 | 表格组件 | 缺少防抖优化 | 输入防抖处理 |
| PF-004 | API调用 | 无请求缓存 | 使用SWR缓存 |

#### 6. 测试覆盖问题

| 问题编号 | 问题描述 | 建议改进 |
|---------|---------|---------|
| TC-001 | 项目无测试框架配置 | 配置Jest + React Testing Library |
| TC-002 | 无单元测试 | 为核心逻辑添加单元测试 |
| TC-003 | 无集成测试 | 为API添加集成测试 |
| TC-004 | 无E2E测试 | 配置Playwright进行E2E测试 |

#### 7. API设计问题

| 问题编号 | 问题描述 | 当前状态 | 建议改进 |
|---------|---------|---------|---------|
| API-001 | 响应格式不统一 | 部分返回{success, data}，部分直接返回数据 | 统一响应格式 |
| API-002 | 错误处理不一致 | 错误码和消息格式不统一 | 定义错误码规范 |
| API-003 | 缺少API文档 | 无文档 | 添加OpenAPI/Swagger |
| API-004 | 缺少请求验证 | 手动验证 | 使用Zod schema |
| API-005 | 缺少速率限制 | 无限制 | 添加rate limiting |

#### 8. 可维护性问题

| 问题编号 | 问题描述 | 建议改进 |
|---------|---------|---------|
| MT-001 | 代码注释不足 | 添加JSDoc注释 |
| MT-002 | 魔法数字和硬编码 | 提取为常量 |
| MT-003 | 缺少ESLint严格规则 | 配置更严格的lint规则 |
| MT-004 | 无代码格式化配置 | 配置Prettier |
| MT-005 | 缺少Git hooks | 配置husky + lint-staged |



## Data Models

### 建议新增的数据模型

```prisma
// 战略表格数据通用模型
model StrategyTableData {
  id           String   @id @default(cuid())
  enterpriseId String
  departmentId String?
  tableType    String   // financial, market, value, process, team, review
  columns      String   @db.LongText // JSON
  data         String   @db.LongText // JSON
  rowHeights   String?  @db.Text     // JSON
  version      Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  createdBy    String?
  
  @@unique([enterpriseId, departmentId, tableType])
  @@map("strategy_table_data")
}

// AI配置持久化
model AIConfiguration {
  id           String   @id @default(cuid())
  enterpriseId String   @unique
  apiBaseUrl   String
  apiKey       String   // 应加密存储
  model        String
  contextInfo  String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("ai_configurations")
}

// AI聊天历史持久化
model AIChatHistory {
  id           String   @id @default(cuid())
  enterpriseId String
  userId       String
  title        String
  pageTitle    String
  messages     String   @db.LongText // JSON
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([enterpriseId, userId])
  @@map("ai_chat_histories")
}
```

### 建议的API响应格式规范

```typescript
// 统一成功响应
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 统一错误响应
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;      // 错误码，如 'AUTH_001'
    message: string;   // 用户友好的错误信息
    details?: unknown; // 开发环境下的详细信息
  };
}

// 分页响应
interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于对需求的分析，以下是可测试的正确性属性：

### Property 1: API认证一致性

*For any* API端点（除公开端点如login、register外），当请求不包含有效的认证token时，系统应返回401状态码。

**Validates: Requirements 3.1, 3.3**

### Property 2: API响应格式一致性

*For any* API响应，响应体应包含`success`字段，且当`success`为true时应包含`data`字段，当`success`为false时应包含`error`字段。

**Validates: Requirements 8.2, 8.3**

### Property 3: 数据验证完整性

*For any* API POST/PUT请求，当请求体缺少必需字段时，系统应返回400状态码和明确的错误信息。

**Validates: Requirements 4.3, 8.3**

## Error Handling

### 当前错误处理问题

1. **不一致的错误响应格式**
   - 部分API返回 `{ error: 'message' }`
   - 部分API返回 `{ success: false, error: 'message' }`

2. **错误信息可能泄露敏感信息**
   - 数据库错误直接返回给客户端
   - 堆栈信息在生产环境可能暴露

### 建议的错误处理方案

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  AUTH_INVALID_TOKEN: { code: 'AUTH_001', message: '无效的认证令牌', status: 401 },
  AUTH_EXPIRED_TOKEN: { code: 'AUTH_002', message: '认证令牌已过期', status: 401 },
  AUTH_UNAUTHORIZED: { code: 'AUTH_003', message: '无权访问此资源', status: 403 },
  VALIDATION_FAILED: { code: 'VAL_001', message: '请求参数验证失败', status: 400 },
  NOT_FOUND: { code: 'NOT_001', message: '资源不存在', status: 404 },
  INTERNAL_ERROR: { code: 'INT_001', message: '服务器内部错误', status: 500 },
} as const;

// lib/api-response.ts
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message });
}

export function errorResponse(error: AppError | Error) {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : 'INT_001';
  const message = isAppError ? error.message : '服务器内部错误';
  
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code, 
        message,
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      } 
    },
    { status: statusCode }
  );
}
```



## Testing Strategy

### 测试框架配置

```json
// package.json 新增
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 测试策略

1. **单元测试** - 核心业务逻辑
   - 认证函数 (hashPassword, comparePassword, generateToken, verifyToken)
   - 数据转换函数
   - 工具函数

2. **集成测试** - API端点
   - 认证流程 (login, register)
   - CRUD操作
   - 权限验证

3. **属性测试** - 使用fast-check
   - API响应格式一致性
   - 数据验证完整性

### 属性测试示例

```typescript
import fc from 'fast-check';

// Property 1: API认证一致性
describe('API Authentication Consistency', () => {
  const protectedEndpoints = [
    '/api/enterprise/departments',
    '/api/enterprise/users',
    '/api/enterprise/customer-structure',
  ];

  it.each(protectedEndpoints)(
    'should return 401 for %s without token',
    async (endpoint) => {
      const response = await fetch(endpoint);
      expect(response.status).toBe(401);
    }
  );
});

// Property 2: API响应格式一致性
describe('API Response Format Consistency', () => {
  it('all API responses should have consistent format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...apiEndpoints),
        async (endpoint) => {
          const response = await fetch(endpoint);
          const data = await response.json();
          
          expect(data).toHaveProperty('success');
          if (data.success) {
            expect(data).toHaveProperty('data');
          } else {
            expect(data).toHaveProperty('error');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## 改进优先级排序

### P0 - 紧急 (安全相关)

| 编号 | 问题 | 工作量 | 影响 |
|-----|------|-------|------|
| SEC-001 | JWT_SECRET默认值 | 0.5h | 安全漏洞 |
| SEC-002 | API认证中间件 | 4h | 安全漏洞 |
| SEC-004 | 输入验证 | 8h | 安全漏洞 |

### P1 - 高优先级 (数据可靠性)

| 编号 | 问题 | 工作量 | 影响 |
|-----|------|-------|------|
| DP-001~004 | 表格数据持久化 | 16h | 数据丢失 |
| API-001 | 响应格式统一 | 4h | 开发效率 |
| API-002 | 错误处理统一 | 4h | 调试效率 |

### P2 - 中优先级 (代码质量)

| 编号 | 问题 | 工作量 | 影响 |
|-----|------|-------|------|
| CQ-001 | 拆分大组件 | 8h | 可维护性 |
| CQ-004 | 抽取公共Hook | 4h | 代码复用 |
| SM-003 | 数据缓存策略 | 4h | 性能 |
| TC-001 | 测试框架配置 | 2h | 代码质量 |

### P3 - 低优先级 (优化)

| 编号 | 问题 | 工作量 | 影响 |
|-----|------|-------|------|
| PF-001~004 | 性能优化 | 8h | 用户体验 |
| MT-001~005 | 可维护性改进 | 4h | 开发效率 |
| API-003 | API文档 | 4h | 开发效率 |

## 实施路线图

```
Phase 1 (Week 1): 安全加固
├── 修复JWT_SECRET问题
├── 添加API认证中间件
└── 实现输入验证

Phase 2 (Week 2-3): 数据持久化
├── 设计通用表格数据模型
├── 实现表格数据API
└── 迁移现有表格组件

Phase 3 (Week 4): 代码重构
├── 拆分enterprise/page.tsx
├── 抽取公共表格Hook
└── 统一API响应格式

Phase 4 (Week 5): 测试与文档
├── 配置测试框架
├── 编写核心单元测试
└── 添加API文档

Phase 5 (Week 6): 优化
├── 性能优化
├── 状态管理优化
└── 可维护性改进
```

