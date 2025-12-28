import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET: Get a single strategy
export const GET = withAuth(
  async ({ user }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '战略ID为必填项');
      }

      const strategy = await prisma.strategy.findFirst({
        where: {
          id,
          enterpriseId: user.enterpriseId,
        },
        include: {
          marketData: { orderBy: { sortOrder: 'asc' } },
          frameworks: { orderBy: { sortOrder: 'asc' } },
          winningPoints: { orderBy: { sortOrder: 'asc' } },
          actionPlans: { orderBy: { sortOrder: 'asc' } },
          keyMetrics: { orderBy: { sortOrder: 'asc' } },
          department: true,
        },
      });

      if (!strategy) {
        return errorFromCode('STR_NOT_FOUND');
      }

      return successResponse(strategy);
    } catch (error) {
      console.error('Error fetching strategy:', error);
      return errorFromCode('STR_LIST_FAILED', error, '获取战略详情失败');
    }
  },
  { requireEnterprise: true }
);

// PUT: Update a strategy
export const PUT = withAuth(
  async ({ user, request }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '战略ID为必填项');
      }

      const body = await request.json();
      const { title, moduleType, departmentId, coreProblem } = body;

      const existing = await prisma.strategy.findFirst({
        where: { id, enterpriseId: user.enterpriseId },
      });

      if (!existing) {
        return errorFromCode('STR_NOT_FOUND');
      }

      const strategy = await prisma.strategy.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          moduleType: moduleType ?? existing.moduleType,
          departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
          coreProblem: coreProblem !== undefined ? coreProblem : existing.coreProblem,
        },
        include: {
          department: true,
        },
      });

      return successResponse(strategy);
    } catch (error) {
      console.error('Error updating strategy:', error);
      return errorFromCode('STR_UPDATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// DELETE: Delete a strategy
export const DELETE = withAuth(
  async ({ user }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '战略ID为必填项');
      }

      const existing = await prisma.strategy.findFirst({
        where: { id, enterpriseId: user.enterpriseId },
      });

      if (!existing) {
        return errorFromCode('STR_NOT_FOUND');
      }

      await prisma.strategy.delete({ where: { id } });

      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      return errorFromCode('STR_DELETE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
