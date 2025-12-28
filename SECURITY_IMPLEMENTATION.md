# 安全实施文档

## 概述

本文档记录了战略绩效系统的安全加固实施情况，包括已实现的安全措施、使用方法和后续优化建议。

## 已实现的安全功能

### 1. API 限流（Rate Limiting）

**文件位置**: `src/lib/middleware/rate-limit.ts`

**功能特性**:
- 基于 IP 的限流
- 多级限流策略（标准、严格、上传）
- 可自定义限流规则
- 支持跳过特定请求

**使用示例**:
```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit';

export const GET = withRateLimit(async (req: NextRequest) => {
  // API 处理逻辑
}, {
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
});
```

### 2. 安全响应头（Security Headers）

**文件位置**: `src/lib/middleware/security-headers.ts`

**实现的安全头**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy
- 更多...

### 3. CSRF 防护

**文件位置**: `src/lib/middleware/csrf.ts`

**功能特性**:
- 双重提交 Cookie 模式
- Token 哈希存储
- 自动 Token 生成和验证
- 可配置排除路径

**客户端使用**:
```javascript
// 获取 CSRF Token
const token = document.querySelector('meta[name="csrf-token"]')?.content;

// 在请求中包含 Token
fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### 4. XSS 防护

**文件位置**: `src/lib/security/xss-protection.ts`

**功能特性**:
- HTML 实体编码
- JavaScript 字符串编码
- CSS 值编码
- HTML 清理和净化
- 文件名安全验证

**使用示例**:
```typescript
import { xssProtection } from '@/lib/security/xss-protection';

// HTML 编码
const safe = xssProtection.escapeHtml(userInput);

// HTML 净化
const cleaned = xssProtection.sanitizeHtml(htmlContent);

// JSON 数据清理
const safeData = xssProtection.sanitizeJson(requestBody);
```

### 5. 统一安全中间件

**文件位置**: `src/lib/middleware/security.ts`

**功能整合**:
- 限流保护
- CSRF 验证
- 安全响应头
- 来源检查
- 路由级配置

## 环境变量配置

需要在 `.env` 文件中添加以下安全相关配置：

```env
# CSRF 密钥
CSRF_SECRET="your-32-char-secret-here"

# 会话密钥
SESSION_SECRET="your-32-char-secret-here"

# 允许的来源
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# 环境
NODE_ENV="production"
```

## 在 API 路由中使用

### 方法一：使用统一安全包装器

```typescript
import { withSecurity } from '@/lib/middleware/security';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withSecurity(async (req: NextRequest) => {
  // 您的 API 逻辑
  return NextResponse.json({ success: true });
}, {
  rateLimitType: 'standard',
  enableCsrf: true,
});
```

### 方法二：单独使用各个安全功能

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withCsrfProtection } from '@/lib/middleware/csrf';
import { withSecureHeaders } from '@/lib/middleware/security-headers';

export const POST = withSecureHeaders(
  withCsrfProtection(
    withRateLimit(async (req: NextRequest) => {
      // API 逻辑
    })
  )
);
```

## 客户端集成

### 1. CSRF Token 处理

在布局组件中添加 CSRF 元标签：

```tsx
import { generateCsrfMetaTag } from '@/lib/middleware/csrf';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: generateCsrfMetaTag()
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. 安全的 API 请求

创建一个安全的 fetch 包装器：

```typescript
// utils/api-client.ts
export async function secureFetch(url: string, options: RequestInit = {}) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const headers = new Headers(options.headers);

  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 包含 Cookie
  });
}
```

### 3. XSS 防护的数据展示

```tsx
import { useSafeHtml } from '@/lib/security/xss-protection';

function UserComment({ content }: { content: string }) {
  const safeContent = useSafeHtml(content);

  return (
    <div dangerouslySetInnerHTML={{ __html: safeContent }} />
  );
}
```

## 安全检查清单

- [x] API 限流已启用
- [x] CSRF 保护已实施
- [x] 安全响应头已配置
- [x] XSS 防护已实现
- [x] 中间件已集成
- [ ] HTTPS 强制（生产环境）
- [ ] 安全日志记录
- [ ] 入侵检测系统
- [ ] 定期安全审计

## 后续优化建议

### 1. 添加请求签名验证

```typescript
// 为敏感 API 添加请求签名
export function verifyRequestSignature(req: NextRequest) {
  const signature = req.headers.get('X-Signature');
  const timestamp = req.headers.get('X-Timestamp');
  // 实现签名验证逻辑
}
```

### 2. 实现 API 密钥管理

```typescript
// API 密钥验证中间件
export function validateApiKey(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  // 验证 API 密钥
}
```

### 3. 添加安全事件日志

```typescript
// 安全事件记录
export function logSecurityEvent(event: SecurityEvent) {
  // 记录到日志系统
}
```

### 4. 实现 WAF 规则

```typescript
// Web 应用防火墙规则
export function wafRules(req: NextRequest) {
  // 实现 SQL 注入检测
  // 实现路径遍历检测
  // 实现恶意负载检测
}
```

## 测试安全功能

### 1. 测试限流

```bash
# 快速发送多个请求测试限流
for i in {1..110}; do
  curl http://localhost:3000/api/test
done
```

### 2. 测试 CSRF

```javascript
// 不带 Token 的请求应该失败
fetch('/api/protected', {
  method: 'POST',
  body: JSON.stringify({ data: 'test' })
});
```

### 3. 测试 XSS 防护

```javascript
// 尝试注入恶意脚本
const malicious = '<script>alert("XSS")</script>';
const safe = xssProtection.sanitizeHtml(malicious);
console.log(safe); // 应该移除 script 标签
```

## 生产环境部署注意事项

1. **环境变量**: 确保所有密钥使用强随机值
2. **HTTPS**: 必须启用 HTTPS
3. **监控**: 配置安全事件监控和告警
4. **备份**: 定期备份安全配置和日志
5. **更新**: 定期更新依赖包和安全补丁

## 故障排除

### 问题：CSRF Token 验证失败

**解决方案**:
1. 检查客户端是否正确发送 Token
2. 验证 Cookie 设置是否正确
3. 确保同源策略配置正确

### 问题：限流触发过早

**解决方案**:
1. 调整限流窗口和阈值
2. 为不同路由配置不同限流策略
3. 考虑使用 Redis 存储替代内存存储

### 问题：CSP 阻止资源加载

**解决方案**:
1. 检查浏览器控制台的 CSP 违规报告
2. 适当调整 CSP 策略
3. 使用 nonce 或 hash 允许特定脚本

## 联系方式

如有安全问题或建议，请联系：
- 安全团队邮箱：security@example.com
- 紧急安全热线：+86-xxx-xxxx-xxxx