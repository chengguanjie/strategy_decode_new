import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// POST: Create a dashboard card
export const POST = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const body = await request.json();
      const { name, targetValue, currentValue, unit, progress, status, sortOrder } = body;

      if (!name || !targetValue || !currentValue || !unit) {
        return errorResponse('VAL_001', '名称、目标值、当前值和单位为必填项', 400);
      }

      const card = await prisma.dashboardCard.create({
        data: {
          enterpriseId: user.enterpriseId!,
          name,
          targetValue,
          currentValue,
          unit,
          progress: progress || 0,
          status: status || 'warning',
          sortOrder: sortOrder || 0,
        },
      });

      return successResponse(card);
    } catch (error) {
      console.error('Dashboard card create error:', error);
      return errorFromCode('DASH_UPDATE_FAILED', error, '创建仪表盘卡片失败');
    }
  },
  { requireEnterprise: true }
);
