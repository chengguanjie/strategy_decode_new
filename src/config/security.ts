/**
 * 安全配置
 * 包含所有安全相关的配置项
 */

export const securityConfig = {
  // API 限流配置
  rateLimit: {
    // 标准 API 限流
    standard: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每个IP最多100个请求
      message: '请求过于频繁，请稍后再试',
      standardHeaders: true,
      legacyHeaders: false,
    },
    // 严格限流（用于登录、注册等敏感操作）
    strict: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 5, // 每个IP最多5个请求
      message: '操作过于频繁，请15分钟后再试',
      skipSuccessfulRequests: true, // 成功的请求不计入限制
    },
    // 文件上传限流
    upload: {
      windowMs: 60 * 60 * 1000, // 1小时
      max: 20, // 每个IP最多20个上传请求
      message: '上传请求过多，请稍后再试',
    },
  },

  // CORS 配置
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 预检请求缓存1天
  },

  // CSRF 配置
  csrf: {
    secret: process.env.CSRF_SECRET || 'csrf-secret-key',
    cookieName: 'csrf-token',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 1000, // 1天
    },
  },

  // JWT 配置
  jwt: {
    accessTokenExpiry: '2h',
    refreshTokenExpiry: '7d',
    issuer: 'strategy-decode',
    audience: 'strategy-decode-users',
  },

  // 密码策略
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    bcryptRounds: 10,
  },

  // 登录安全
  login: {
    maxAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30分钟
    captchaThreshold: 3, // 失败3次后需要验证码
  },

  // 安全响应头
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 需要
      "style-src 'self' 'unsafe-inline'", // 样式
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },

  // 文件上传安全
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.xls', '.xlsx', '.csv'],
    scanForVirus: true,
  },

  // SQL 注入防护
  database: {
    enableQueryLogging: process.env.NODE_ENV !== 'production',
    maxQueryLength: 10000,
    blockedKeywords: ['DROP', 'TRUNCATE', 'DELETE FROM', 'UPDATE SET'],
  },

  // XSS 防护配置
  xss: {
    enableSanitization: true,
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  },

  // 会话安全
  session: {
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
    },
  },

  // API 密钥配置
  apiKey: {
    headerName: 'X-API-Key',
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90天
    rotationPeriod: 30 * 24 * 60 * 60 * 1000, // 30天
  },

  // 日志安全
  logging: {
    sanitizeFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
    maxLogSize: 1024 * 1024, // 1MB
    retentionDays: 30,
  },
};