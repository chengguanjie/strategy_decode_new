import { NextRequest, NextResponse } from 'next/server';
import { securityConfig } from '@/config/security';

/**
 * 安全响应头中间件
 * 添加各种安全相关的 HTTP 响应头
 */
export function securityHeaders() {
  return securityConfig.headers;
}

/**
 * 应用安全响应头到 NextResponse
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = securityHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * 创建带有安全响应头的 NextResponse
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init);
  return applySecurityHeaders(response);
}

/**
 * 安全响应头中间件（用于 Next.js middleware）
 */
export async function withSecurityHeaders(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler(request);
  return applySecurityHeaders(response);
}

/**
 * API 路由的安全响应头包装器
 */
export function withSecureHeaders<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const response = await handler(...args);
    return applySecurityHeaders(response);
  }) as T;
}

/**
 * 根据环境动态调整安全头
 */
export function getDynamicSecurityHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { ...securityConfig.headers };

  // 开发环境调整
  if (process.env.NODE_ENV === 'development') {
    // 开发环境放宽 CSP 限制
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace("'self'", "'self' http://localhost:*")
      .replace("connect-src 'self'", "connect-src 'self' ws://localhost:* http://localhost:*");
  }

  // 如果是 API 请求，添加额外的头
  if (request.nextUrl.pathname.startsWith('/api/')) {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }

  // 如果是静态资源，设置缓存头
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }

  return headers;
}

/**
 * CORS 预检请求处理
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const allowedOrigins = securityConfig.cors.origin;

  // 检查来源是否允许
  if (origin && Array.isArray(allowedOrigins) && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });

  // 设置 CORS 头
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', securityConfig.cors.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', securityConfig.cors.maxAge.toString());
  response.headers.set('Access-Control-Allow-Credentials', securityConfig.cors.credentials.toString());

  return response;
}

/**
 * 检查请求来源是否安全
 */
export function isSecureOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 没有来源信息，可能是直接访问
  if (!origin && !referer) {
    return true;
  }

  const allowedOrigins = securityConfig.cors.origin;

  // 检查 Origin
  if (origin && Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }

  // 检查 Referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return Array.isArray(allowedOrigins) && allowedOrigins.some(allowed => {
        const allowedUrl = new URL(allowed);
        return refererUrl.origin === allowedUrl.origin;
      });
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * 生成 CSP nonce
 */
export function generateCspNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}

/**
 * 应用 CSP nonce 到响应
 */
export function applyCspNonce(response: NextResponse, nonce: string): NextResponse {
  const csp = response.headers.get('Content-Security-Policy');
  if (csp) {
    const updatedCsp = csp
      .replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
      .replace("style-src 'self'", `style-src 'self' 'nonce-${nonce}'`);
    response.headers.set('Content-Security-Policy', updatedCsp);
  }
  return response;
}