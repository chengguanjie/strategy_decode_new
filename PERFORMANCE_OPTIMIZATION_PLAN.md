# 性能优化详细执行计划

## 概述

本文档详细规划了战略绩效系统的性能优化工作，旨在提升系统响应速度、减少资源消耗、改善用户体验。

## 一、数据库优化

### 1.1 数据库索引优化

#### 执行时间：立即开始

#### 分析当前查询模式

1. **高频查询字段识别**
   ```sql
   -- 需要索引的字段
   users: email, enterpriseId, role
   enterprises: name, code
   departments: enterpriseId, parentId, code
   strategies: enterpriseId, departmentId, year
   ```

2. **复合索引设计**
   ```sql
   -- 登录查询优化
   CREATE INDEX idx_users_email ON users(email);

   -- 企业用户查询
   CREATE INDEX idx_users_enterprise_role ON users(enterpriseId, role);

   -- 部门层级查询
   CREATE INDEX idx_departments_enterprise_parent ON departments(enterpriseId, parentId);

   -- 战略查询
   CREATE INDEX idx_strategies_enterprise_year ON strategies(enterpriseId, year);
   CREATE INDEX idx_strategies_department ON strategies(departmentId);
   ```

3. **性能监控索引**
   ```sql
   -- 创建时间索引（用于日志和审计）
   CREATE INDEX idx_users_created_at ON users(createdAt);
   CREATE INDEX idx_strategies_updated_at ON strategies(updatedAt);
   ```

### 1.2 N+1 查询问题优化

#### 执行时间：本周内完成

#### 问题识别与解决方案

1. **用户与企业关联查询**
   ```typescript
   // 问题代码
   const users = await prisma.user.findMany();
   for (const user of users) {
     const enterprise = await prisma.enterprise.findUnique({
       where: { id: user.enterpriseId }
     });
   }

   // 优化后
   const users = await prisma.user.findMany({
     include: {
       enterprise: true
     }
   });
   ```

2. **部门树形结构查询**
   ```typescript
   // 创建递归查询服务
   class DepartmentService {
     async getDepartmentTree(enterpriseId: string) {
       // 一次性获取所有部门
       const departments = await prisma.department.findMany({
         where: { enterpriseId },
         include: {
           users: true,
           strategies: true
         }
       });

       // 内存中构建树形结构
       return this.buildTree(departments);
     }
   }
   ```

3. **战略详情批量查询**
   ```typescript
   // 使用 Prisma 的批量操作
   const strategies = await prisma.strategy.findMany({
     where: { enterpriseId },
     include: {
       department: true,
       createdBy: true,
       updatedBy: true
     }
   });
   ```

### 1.3 查询结果缓存

#### 执行时间：第2周

#### 实现方案

1. **内存缓存层**
   ```typescript
   // src/lib/cache/memory-cache.ts
   class MemoryCache {
     private cache = new Map<string, { data: any; expiry: number }>();

     set(key: string, data: any, ttl: number) {
       this.cache.set(key, {
         data,
         expiry: Date.now() + ttl * 1000
       });
     }

     get(key: string) {
       const item = this.cache.get(key);
       if (!item || item.expiry < Date.now()) {
         this.cache.delete(key);
         return null;
       }
       return item.data;
     }
   }
   ```

2. **查询缓存装饰器**
   ```typescript
   function Cacheable(ttl: number = 300) {
     return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
       const originalMethod = descriptor.value;

       descriptor.value = async function (...args: any[]) {
         const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
         const cached = cache.get(cacheKey);

         if (cached) return cached;

         const result = await originalMethod.apply(this, args);
         cache.set(cacheKey, result, ttl);
         return result;
       };
     };
   }
   ```

### 1.4 数据库连接池优化

#### 执行时间：第2周

#### 配置优化

```typescript
// src/lib/prisma-optimized.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // 连接池配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 连接池大小
  // 基于服务器配置调整
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
  // 查询超时
  queryTimeout: 10000,
  // 连接超时
  connectTimeout: 5000,
});

// 连接池监控
prisma.$on('query' as never, async (e: any) => {
  if (e.duration > 1000) {
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});
```

## 二、缓存策略实施

### 2.1 Redis 集成

#### 执行时间：第3周

#### 实施步骤

1. **安装依赖**
   ```bash
   npm install redis ioredis
   npm install @types/redis --save-dev
   ```

2. **Redis 客户端配置**
   ```typescript
   // src/lib/redis/client.ts
   import Redis from 'ioredis';

   export const redis = new Redis({
     host: process.env.REDIS_HOST || 'localhost',
     port: parseInt(process.env.REDIS_PORT || '6379'),
     password: process.env.REDIS_PASSWORD,
     db: parseInt(process.env.REDIS_DB || '0'),
     retryStrategy: (times) => Math.min(times * 50, 2000),
     enableOfflineQueue: false,
   });

   redis.on('error', (err) => {
     console.error('Redis Client Error:', err);
   });
   ```

3. **缓存服务实现**
   ```typescript
   // src/lib/cache/redis-cache.ts
   class RedisCache {
     async get<T>(key: string): Promise<T | null> {
       const data = await redis.get(key);
       return data ? JSON.parse(data) : null;
     }

     async set(key: string, value: any, ttl?: number) {
       const data = JSON.stringify(value);
       if (ttl) {
         await redis.set(key, data, 'EX', ttl);
       } else {
         await redis.set(key, data);
       }
     }

     async invalidate(pattern: string) {
       const keys = await redis.keys(pattern);
       if (keys.length > 0) {
         await redis.del(...keys);
       }
     }
   }
   ```

### 2.2 API 响应缓存

#### 执行时间：第3周

#### 实现方案

1. **缓存中间件**
   ```typescript
   // src/lib/middleware/cache.ts
   export function cacheMiddleware(options: {
     ttl?: number;
     keyGenerator?: (req: NextRequest) => string;
   } = {}) {
     const { ttl = 300, keyGenerator = defaultKeyGenerator } = options;

     return async (req: NextRequest, handler: () => Promise<NextResponse>) => {
       // 仅缓存 GET 请求
       if (req.method !== 'GET') {
         return handler();
       }

       const key = keyGenerator(req);
       const cached = await redisCache.get(key);

       if (cached) {
         return NextResponse.json(cached, {
           headers: { 'X-Cache': 'HIT' }
         });
       }

       const response = await handler();
       const data = await response.json();

       await redisCache.set(key, data, ttl);

       return NextResponse.json(data, {
         headers: { 'X-Cache': 'MISS' }
       });
     };
   }
   ```

2. **缓存失效策略**
   ```typescript
   // 数据变更时清除相关缓存
   class CacheInvalidator {
     async onUserUpdate(userId: string) {
       await redisCache.invalidate(`user:${userId}:*`);
       await redisCache.invalidate(`users:*`);
     }

     async onStrategyUpdate(strategyId: string, enterpriseId: string) {
       await redisCache.invalidate(`strategy:${strategyId}:*`);
       await redisCache.invalidate(`strategies:${enterpriseId}:*`);
     }
   }
   ```

### 2.3 静态资源缓存优化

#### 执行时间：第4周

#### Next.js 配置优化

```typescript
// next.config.js
module.exports = {
  // 静态资源缓存配置
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 图片优化配置
  images: {
    domains: ['your-cdn-domain.com'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/webp'],
  },
};
```

## 三、前端性能优化

### 3.1 图片懒加载实现

#### 执行时间：第4周

#### 实现方案

1. **懒加载组件**
   ```typescript
   // src/components/common/LazyImage.tsx
   import { useState, useEffect, useRef } from 'react';

   export function LazyImage({ src, alt, className, placeholder }: LazyImageProps) {
     const [imageSrc, setImageSrc] = useState(placeholder);
     const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

     useEffect(() => {
       let observer: IntersectionObserver;

       if (imageRef && imageSrc === placeholder) {
         observer = new IntersectionObserver(
           (entries) => {
             entries.forEach((entry) => {
               if (entry.isIntersecting) {
                 setImageSrc(src);
                 observer.unobserve(imageRef);
               }
             });
           },
           { threshold: 0.1, rootMargin: '50px' }
         );
         observer.observe(imageRef);
       }

       return () => {
         if (observer) observer.disconnect();
       };
     }, [imageRef, imageSrc, placeholder, src]);

     return (
       <img
         ref={setImageRef}
         src={imageSrc}
         alt={alt}
         className={className}
         loading="lazy"
       />
     );
   }
   ```

2. **Next.js Image 组件优化**
   ```typescript
   import Image from 'next/image';

   // 使用 Next.js 内置的图片优化
   <Image
     src="/hero-image.jpg"
     alt="Hero"
     width={1200}
     height={600}
     priority={false} // 非首屏图片
     loading="lazy"
     placeholder="blur"
     blurDataURL="data:image/jpeg;base64,..."
   />
   ```

### 3.2 代码分割优化

#### 执行时间：第5周

#### 实施方案

1. **路由级代码分割**
   ```typescript
   // 使用动态导入
   import dynamic from 'next/dynamic';

   const StrategyDetail = dynamic(
     () => import('@/components/strategy/StrategyDetail'),
     {
       loading: () => <LoadingSpinner />,
       ssr: false, // 仅客户端渲染的组件
     }
   );
   ```

2. **组件懒加载**
   ```typescript
   // 大型组件懒加载
   const HeavyChart = dynamic(
     () => import('@/components/charts/HeavyChart'),
     {
       loading: () => <ChartSkeleton />,
       ssr: false,
     }
   );

   // 条件加载
   const AdminPanel = dynamic(() => {
     return import('@/components/admin/AdminPanel');
   }, {
     loading: () => <div>Loading admin panel...</div>,
     ssr: false,
   });
   ```

3. **第三方库优化**
   ```typescript
   // 按需加载第三方库
   const loadMoment = async () => {
     const { default: moment } = await import('moment');
     return moment;
   };

   // 使用时才加载
   const formatDate = async (date: string) => {
     const moment = await loadMoment();
     return moment(date).format('YYYY-MM-DD');
   };
   ```

### 3.3 资源预加载

#### 执行时间：第5周

#### 实施方案

1. **关键资源预加载**
   ```typescript
   // src/pages/_document.tsx
   import { Html, Head, Main, NextScript } from 'next/document';

   export default function Document() {
     return (
       <Html>
         <Head>
           {/* 预连接到API服务器 */}
           <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />

           {/* 预加载关键字体 */}
           <link
             rel="preload"
             href="/fonts/inter-var.woff2"
             as="font"
             type="font/woff2"
             crossOrigin="anonymous"
           />

           {/* DNS预解析 */}
           <link rel="dns-prefetch" href="//cdn.example.com" />
         </Head>
         <body>
           <Main />
           <NextScript />
         </body>
       </Html>
     );
   }
   ```

2. **路由预取**
   ```typescript
   // 预取下一个可能访问的页面
   import { useRouter } from 'next/router';

   function Navigation() {
     const router = useRouter();

     // 鼠标悬停时预取
     const handleMouseEnter = (href: string) => {
       router.prefetch(href);
     };

     return (
       <nav>
         <Link href="/dashboard">
           <a onMouseEnter={() => handleMouseEnter('/dashboard')}>
             Dashboard
           </a>
         </Link>
       </nav>
     );
   }
   ```

### 3.4 Service Worker 缓存

#### 执行时间：第6周

#### 实施方案

1. **Service Worker 配置**
   ```typescript
   // public/sw.js
   const CACHE_NAME = 'strategy-v1';
   const urlsToCache = [
     '/',
     '/static/css/main.css',
     '/static/js/bundle.js',
   ];

   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then((cache) => cache.addAll(urlsToCache))
     );
   });

   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request)
         .then((response) => response || fetch(event.request))
     );
   });
   ```

2. **PWA 配置**
   ```typescript
   // next.config.js
   const withPWA = require('next-pwa')({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
     register: true,
     skipWaiting: true,
     runtimeCaching: [
       {
         urlPattern: /^https:\/\/api\.example\.com\/.*/i,
         handler: 'NetworkFirst',
         options: {
           cacheName: 'api-cache',
           expiration: {
             maxEntries: 10,
             maxAgeSeconds: 60 * 60 * 24, // 24 hours
           },
         },
       },
     ],
   });

   module.exports = withPWA(nextConfig);
   ```

## 四、性能监控指标

### 4.1 关键性能指标（KPI）

1. **服务端性能**
   - API 响应时间 < 200ms (P95)
   - 数据库查询时间 < 50ms (P95)
   - 缓存命中率 > 80%
   - 并发处理能力 > 1000 req/s

2. **前端性能**
   - 首次内容绘制（FCP）< 1.5s
   - 最大内容绘制（LCP）< 2.5s
   - 首次输入延迟（FID）< 100ms
   - 累积布局偏移（CLS）< 0.1

### 4.2 性能测试工具

1. **服务端测试**
   ```bash
   # Apache Bench
   ab -n 1000 -c 100 http://localhost:3000/api/users

   # Artillery
   artillery quick --count 100 --num 10 http://localhost:3000/api/strategies
   ```

2. **前端测试**
   ```bash
   # Lighthouse CLI
   lighthouse http://localhost:3000 --view

   # WebPageTest
   npm install -g webpagetest
   webpagetest test http://localhost:3000
   ```

## 五、实施时间表

| 周次 | 任务 | 预期成果 |
|-----|------|---------|
| 第1周 | 数据库索引优化 | 查询性能提升 50% |
| 第2周 | N+1 查询优化 & 连接池配置 | 减少数据库查询次数 70% |
| 第3周 | Redis 集成 & API 缓存 | API 响应速度提升 60% |
| 第4周 | 图片懒加载 & 静态资源优化 | 页面加载速度提升 40% |
| 第5周 | 代码分割 & 资源预加载 | 首屏加载时间减少 30% |
| 第6周 | Service Worker & 性能测试 | 离线访问支持，性能基准确立 |

## 六、风险与应对

1. **缓存一致性问题**
   - 风险：数据更新后缓存未及时失效
   - 应对：实施完善的缓存失效策略

2. **Redis 单点故障**
   - 风险：Redis 宕机导致服务降级
   - 应对：实施 Redis 集群或故障转移

3. **内存占用增加**
   - 风险：缓存导致内存压力
   - 应对：合理设置 TTL，监控内存使用

4. **代码复杂度增加**
   - 风险：优化代码增加维护难度
   - 应对：充分的文档和测试覆盖

## 七、成功标准

1. **性能提升**
   - 整体响应时间减少 50%
   - 数据库查询效率提升 60%
   - 前端加载速度提升 40%

2. **用户体验**
   - 页面交互流畅无卡顿
   - 加载时间明显缩短
   - 离线功能部分可用

3. **系统稳定性**
   - 无新增性能相关 bug
   - 监控指标正常
   - 资源使用可控