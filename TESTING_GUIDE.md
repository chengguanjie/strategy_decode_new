# 测试指南 - 战略绩效系统

## 📋 目录

1. [测试体系概述](#测试体系概述)
2. [运行测试](#运行测试)
3. [测试覆盖率](#测试覆盖率)
4. [编写测试](#编写测试)
5. [测试最佳实践](#测试最佳实践)
6. [持续集成](#持续集成)

## 测试体系概述

本项目采用多层次的测试策略，确保代码质量和系统稳定性：

- **单元测试**：使用 Jest 和 Testing Library
- **集成测试**：测试 API 端点和数据库交互
- **覆盖率目标**：60%（当前：~5%，需要大幅提升）

### 测试文件组织

```
src/
├── __tests__/              # 全局测试工具
├── lib/
│   ├── __tests__/         # 库函数测试
│   └── validations/
│       └── __tests__/     # 验证逻辑测试
├── app/
│   └── api/
│       └── */
│           └── __tests__/ # API 路由测试
└── components/
    └── __tests__/         # 组件测试
```

## 运行测试

### 基础命令

```bash
# 运行所有测试
npm test

# 监视模式（开发时推荐）
npm run test:watch

# 运行特定文件的测试
npm test -- src/lib/validations/__tests__/user.validation.test.ts

# 运行匹配模式的测试
npm test -- --testNamePattern="should validate"
```

### 覆盖率相关

```bash
# 生成覆盖率报告
npm run test:coverage

# 生成并查看 HTML 覆盖率报告
npm run test:coverage:html

# 运行覆盖率分析（包含优先级建议）
npm run test:coverage:analyze
```

## 测试覆盖率

### 当前状态（需要改进）

| 类型 | 当前覆盖率 | 目标 |
|------|-----------|------|
| 语句 | ~5% | 60% |
| 分支 | ~5% | 60% |
| 函数 | ~12% | 60% |
| 行数 | ~5% | 60% |

### 优先测试区域

1. **关键优先级**（API 和认证）
   - `/api/auth/*` - 认证接口
   - `/api/enterprise/*` - 企业管理接口
   - 安全中间件

2. **高优先级**（核心业务逻辑）
   - 数据验证逻辑
   - 数据库操作
   - 业务规则实现

3. **中等优先级**（UI 组件）
   - 关键业务组件
   - 表单组件
   - 数据展示组件

### 查看覆盖率报告

```bash
# 在浏览器中查看详细报告
npm run test:coverage:html

# 查看覆盖率分析和建议
npm run test:coverage:analyze
```

## 编写测试

### 单元测试示例

#### 验证逻辑测试

```typescript
// src/lib/validations/__tests__/user.validation.test.ts
import { validateLoginRequest } from '../user.validation';

describe('User Validation', () => {
  describe('validateLoginRequest', () => {
    it('should validate valid login request', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = validateLoginRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123!',
      };

      const result = validateLoginRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('email');
    });
  });
});
```

#### API 路由测试

```typescript
// src/app/api/auth/me/__tests__/route.test.ts
import { GET } from '../route';
import { createMockRequest } from '@/test-utils';

describe('/api/auth/me', () => {
  it('should return user info with valid token', async () => {
    const request = createMockRequest({
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('email');
  });
});
```

### 测试工具函数

项目提供了多个辅助函数简化测试编写：

```typescript
import {
  createMockRequest,
  createMockUser,
  mockConsole,
} from '@/test-utils';

// 创建模拟请求
const request = createMockRequest({
  method: 'POST',
  body: { email: 'test@example.com' },
});

// 创建模拟用户
const user = createMockUser({
  role: 'MANAGER',
  enterpriseId: 'test-enterprise',
});

// 捕获控制台输出
const { mocks, restore } = mockConsole();
// ... 测试代码
restore();
```

## 测试最佳实践

### 1. 遵循 AAA 模式

```typescript
it('should do something', () => {
  // Arrange - 准备测试数据
  const input = { ... };

  // Act - 执行被测试的代码
  const result = functionUnderTest(input);

  // Assert - 验证结果
  expect(result).toEqual(expected);
});
```

### 2. 使用描述性的测试名称

```typescript
// ❌ 不好的例子
it('test 1', () => { ... });

// ✅ 好的例子
it('should reject empty email in login request', () => { ... });
```

### 3. 测试边界情况

```typescript
describe('validateDepartmentName', () => {
  it('should accept valid names', () => { ... });
  it('should reject empty name', () => { ... });
  it('should reject name longer than 50 characters', () => { ... });
  it('should reject name with special characters', () => { ... });
});
```

### 4. 使用测试数据构建器

```typescript
// 创建可复用的测试数据
const createValidUserData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
  ...overrides,
});

// 使用
const userData = createValidUserData({ email: 'custom@example.com' });
```

### 5. 模拟外部依赖

```typescript
// 模拟 Prisma 客户端
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

## 持续集成

### GitHub Actions 工作流

项目配置了自动化测试工作流：

1. **触发条件**
   - Push 到 main/develop 分支
   - Pull Request

2. **测试矩阵**
   - Node.js 18.x 和 20.x
   - Ubuntu 最新版本

3. **自动功能**
   - 运行所有测试
   - 生成覆盖率报告
   - 上传到 Codecov
   - PR 评论显示覆盖率

### 本地预检

在提交前运行以下命令确保 CI 通过：

```bash
# 运行所有测试和检查
npm test
npm run lint
npm run format:check

# 检查测试覆盖率
npm run test:coverage:analyze
```

## 常见问题

### Q: 测试运行很慢？

使用 `--maxWorkers=50%` 限制并行数：

```bash
npm test -- --maxWorkers=50%
```

### Q: 如何调试失败的测试？

1. 使用 `--verbose` 查看详细输出
2. 使用 `console.log` 打印中间值
3. 使用 `--runInBand` 串行运行测试

```bash
npm test -- --verbose --runInBand
```

### Q: 如何只运行特定的测试？

```bash
# 运行特定文件
npm test -- user.validation.test.ts

# 运行匹配描述的测试
npm test -- --testNamePattern="login"

# 跳过某些测试
it.skip('should ...', () => { ... });

# 只运行某个测试
it.only('should ...', () => { ... });
```

## 下一步行动

1. **提高测试覆盖率**
   - 目标：达到 60% 的整体覆盖率
   - 优先级：API 路由 > 业务逻辑 > UI 组件

2. **添加集成测试**
   - 测试完整的用户流程
   - 测试数据库事务
   - 测试错误处理

3. **性能测试**
   - API 响应时间
   - 数据库查询性能
   - 前端渲染性能

---

更多信息请参考 [Jest 文档](https://jestjs.io/docs/getting-started)。