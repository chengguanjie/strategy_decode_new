import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// DELETE: Delete a user
export const DELETE = withAuth(
  async ({ user: currentUser }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '用户ID为必填项');
      }

      // Only ENTERPRISE_ADMIN can delete users
      if (currentUser.role !== 'ENTERPRISE_ADMIN') {
        return errorFromCode('AUTH_UNAUTHORIZED');
      }

      // Prevent deleting self
      if (id === currentUser.userId) {
        return errorFromCode('USER_DELETE_FAILED', undefined, '不能删除自己的账号');
      }

      // Verify target user belongs to same enterprise
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser || targetUser.enterpriseId !== currentUser.enterpriseId) {
        return errorFromCode('USER_NOT_FOUND', undefined, '用户不存在或不属于您的企业');
      }

      await prisma.user.delete({
        where: { id },
      });

      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      return errorFromCode('USER_DELETE_FAILED', error);
    }
  },
  { requireEnterprise: true, roles: ['enterprise_admin'] }
);
