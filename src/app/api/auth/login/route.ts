import { NextRequest } from 'next/server';
import { prismaWithMonitoring as prisma } from '@/lib/prisma-with-monitoring';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode } from '@/lib/api-response';
import { withPerformanceMonitoring, perf } from '@/lib/performance';
import { logAudit, logError } from '@/lib/logger';

export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      // Validate input using Zod schema
      const validation = validateBody(body, loginSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { email, password } = validation.data;

      // 查找用户（带性能监控）
      const user = await perf.monitor(
        'auth.login.findUser',
        () => prisma.user.findUnique({ where: { email } }),
        { email }
      );

      if (!user) {
        // 记录失败的登录尝试
        logAudit('login', email, 'user-auth', 'failure', {
          reason: 'user_not_found',
        });
        return errorFromCode('AUTH_USER_NOT_FOUND');
      }

      // 验证密码（带性能监控）
      const isValidPassword = await perf.monitor(
        'auth.login.verifyPassword',
        () => comparePassword(password, user.password),
        { userId: user.id }
      );

      if (!isValidPassword) {
        // 记录失败的登录尝试
        logAudit('login', user.id, 'user-auth', 'failure', {
          reason: 'invalid_password',
          email: user.email,
        });
        return errorFromCode('AUTH_INVALID_PASSWORD');
      }

      // 生成令牌
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId || undefined,
      });

      // 记录成功的登录
      logAudit('login', user.id, 'user-auth', 'success', {
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId,
      });

      return successResponse({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          enterpriseId: user.enterpriseId,
        },
      });
    } catch (error) {
      logError(error, 'Login API', { endpoint: '/api/auth/login' });
      return errorFromCode('AUTH_LOGIN_FAILED', error);
    }
  },
  'api.auth.login'
);
