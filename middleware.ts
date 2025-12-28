import { NextRequest } from 'next/server';
import { integratedSecurityMiddleware } from '@/lib/middleware/security';

/**
 * Next.js 中间件
 * 在所有请求之前运行，提供安全保护
 */
export async function middleware(request: NextRequest) {
  return integratedSecurityMiddleware(request);
}

/**
 * 配置中间件匹配的路径
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).)*',
  ],
};