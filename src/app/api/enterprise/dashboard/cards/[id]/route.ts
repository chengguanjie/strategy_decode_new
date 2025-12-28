import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// PUT: Update a dashboard card
export const PUT = withAuth(
  async ({ user, request }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '卡片ID为必填项');
      }

      const body = await request.json();
      const { name, targetValue, currentValue, unit, progress, status } = body;

      const existing = await prisma.dashboardCard.findFirst({
        where: { id, enterpriseId: user.enterpriseId },
      });

      if (!existing) {
        return errorFromCode('DASH_CARD_NOT_FOUND');
      }

      const card = await prisma.dashboardCard.update({
        where: { id },
        data: {
          name: name ?? existing.name,
          targetValue: targetValue ?? existing.targetValue,
          currentValue: currentValue ?? existing.currentValue,
          unit: unit ?? existing.unit,
          progress: progress ?? existing.progress,
          status: status ?? existing.status,
        },
      });

      return successResponse(card);
    } catch (error) {
      console.error('Dashboard card update error:', error);
      return errorFromCode('DASH_CARD_UPDATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// DELETE: Delete a dashboard card
export const DELETE = withAuth(
  async ({ user }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '卡片ID为必填项');
      }

      const existing = await prisma.dashboardCard.findFirst({
        where: { id, enterpriseId: user.enterpriseId },
      });

      if (!existing) {
        return errorFromCode('DASH_CARD_NOT_FOUND');
      }

      await prisma.dashboardCard.delete({
        where: { id },
      });

      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Dashboard card delete error:', error);
      return errorFromCode('DASH_CARD_DELETE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
