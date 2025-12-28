import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { securityConfig } from '@/config/security';
import { errorResponse } from '@/lib/api-response';

/**
 * CSRF Token 管理
 */
export class CsrfTokenManager {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly HASH_ALGORITHM = 'sha256';

  /**
   * 生成 CSRF Token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * 生成 CSRF Token 哈希
   */
  static hashToken(token: string, secret: string): string {
    return crypto
      .createHmac(this.HASH_ALGORITHM, secret)
      .update(token)
      .digest('hex');
  }

  /**
   * 验证 CSRF Token
   */
  static verifyToken(token: string, hashedToken: string, secret: string): boolean {
    const expectedHash = this.hashToken(token, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(hashedToken)
    );
  }
}

/**
 * CSRF 保护选项
 */
export interface CsrfOptions {
  excludePaths?: string[];
  cookieName?: string;
  headerName?: string;
  secret?: string;
  skipMethods?: string[];
}

/**
 * 默认跳过 CSRF 检查的方法
 */
const DEFAULT_SKIP_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * 创建 CSRF 保护中间件
 */
export function createCsrfProtection(options: CsrfOptions = {}) {
  const {
    excludePaths = ['/api/auth/login', '/api/auth/register'],
    cookieName = securityConfig.csrf.cookieName,
    headerName = 'X-CSRF-Token',
    secret = securityConfig.csrf.secret,
    skipMethods = DEFAULT_SKIP_METHODS,
  } = options;

  return async function csrfMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const path = request.nextUrl.pathname;

    // Bearer Token (Authorization header) is not automatically attached by the browser in CSRF scenarios,
    // so CSRF protection is unnecessary for token-authenticated API calls.
    const authHeader = request.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      return null;
    }

    // 检查是否应该跳过 CSRF 保护
    if (
      skipMethods.includes(request.method) ||
      excludePaths.some(excludePath => path.startsWith(excludePath))
    ) {
      return null;
    }

    // 获取 Cookie 中的 CSRF Token
    const cookieToken = request.cookies.get(cookieName)?.value;

    // 获取请求头中的 CSRF Token
    const headerToken = request.headers.get(headerName);

    // 如果没有 Cookie Token，说明是首次请求，生成新的 Token
    if (!cookieToken) {
      return generateCsrfTokenResponse();
    }

    // 验证 CSRF Token
    if (!headerToken) {
      return errorResponse('CSRF_001', 'CSRF Token 缺失', 403);
    }

    try {
      const isValid = CsrfTokenManager.verifyToken(headerToken, cookieToken, secret);

      if (!isValid) {
        return errorResponse('CSRF_002', 'CSRF Token 无效', 403);
      }
    } catch (error) {
      return errorResponse('CSRF_003', 'CSRF Token 验证失败', 403);
    }

    // Token 验证通过
    return null;
  };
}

/**
 * 生成包含 CSRF Token 的响应
 */
function generateCsrfTokenResponse(): NextResponse {
  const token = CsrfTokenManager.generateToken();
  const hashedToken = CsrfTokenManager.hashToken(
    token,
    securityConfig.csrf.secret
  );

  const response = errorResponse('CSRF_004', '需要 CSRF Token', 403, {
    token,
    message: '请在后续请求中包含 CSRF Token',
  });

  // 设置 Cookie
  response.cookies.set({
    name: securityConfig.csrf.cookieName,
    value: hashedToken,
    ...securityConfig.csrf.cookieOptions,
  });

  return response;
}

/**
 * 为响应添加 CSRF Token
 */
export function addCsrfToken(response: NextResponse): NextResponse {
  const token = CsrfTokenManager.generateToken();
  const hashedToken = CsrfTokenManager.hashToken(
    token,
    securityConfig.csrf.secret
  );

  // 设置 Cookie
  response.cookies.set({
    name: securityConfig.csrf.cookieName,
    value: hashedToken,
    ...securityConfig.csrf.cookieOptions,
  });

  // 设置响应头（供客户端读取）
  response.headers.set('X-CSRF-Token', token);

  return response;
}

/**
 * 用于 API 路由的 CSRF 保护包装器
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: CsrfOptions
): T {
  const csrfMiddleware = createCsrfProtection(options);

  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;
    const csrfResponse = await csrfMiddleware(request);

    if (csrfResponse) {
      return csrfResponse;
    }

    return handler(...args);
  }) as T;
}

/**
 * 双重提交 Cookie 模式的 CSRF 保护
 */
export function createDoubleSubmitCsrfProtection(options: CsrfOptions = {}) {
  const {
    cookieName = securityConfig.csrf.cookieName,
    headerName = 'X-CSRF-Token',
    skipMethods = DEFAULT_SKIP_METHODS,
  } = options;

  return async function doubleSubmitCsrfMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    // 检查是否应该跳过 CSRF 保护
    if (skipMethods.includes(request.method)) {
      return null;
    }

    // 获取 Cookie 和 Header 中的 Token
    const cookieToken = request.cookies.get(cookieName)?.value;
    const headerToken = request.headers.get(headerName);

    // 两者都必须存在
    if (!cookieToken || !headerToken) {
      return errorResponse('CSRF_005', 'CSRF 保护验证失败', 403);
    }

    // 两者必须相同
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return errorResponse('CSRF_006', 'CSRF Token 不匹配', 403);
    }

    return null;
  };
}

/**
 * 生成 CSRF Token 元标签（用于页面）
 */
export function generateCsrfMetaTag(): string {
  const token = CsrfTokenManager.generateToken();
  return `<meta name="csrf-token" content="${token}">`;
}

/**
 * 客户端 CSRF Token 管理辅助函数
 */
export const csrfClientHelpers = `
// 从 Cookie 中获取 CSRF Token
function getCsrfTokenFromCookie() {
  const name = '${securityConfig.csrf.cookieName}=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

// 从元标签获取 CSRF Token
function getCsrfTokenFromMeta() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
}

// 在 fetch 请求中添加 CSRF Token
function fetchWithCsrf(url, options = {}) {
  const token = getCsrfTokenFromMeta() || getCsrfTokenFromCookie();

  if (token) {
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token,
    };
  }

  return fetch(url, options);
}
`;
