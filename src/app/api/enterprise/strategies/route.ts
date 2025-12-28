import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET: List strategies
export const GET = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const departmentId = searchParams.get('departmentId');
      const moduleType = searchParams.get('moduleType');

      const where: Record<string, string | undefined> = {
        enterpriseId: user.enterpriseId,
      };

      if (departmentId) {
        where.departmentId = departmentId;
      }

      if (moduleType) {
        where.moduleType = moduleType;
      }

      const strategies = await prisma.strategy.findMany({
        where,
        include: {
          marketData: { orderBy: { sortOrder: 'asc' } },
          frameworks: { orderBy: { sortOrder: 'asc' } },
          winningPoints: { orderBy: { sortOrder: 'asc' } },
          actionPlans: { orderBy: { sortOrder: 'asc' } },
          keyMetrics: { orderBy: { sortOrder: 'asc' } },
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(strategies);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return errorFromCode('STR_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// POST: Create a new strategy
export const POST = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const body = await request.json();
      const { title, moduleType, departmentId, coreProblem } = body;

      if (!title || !moduleType) {
        return errorResponse('VAL_001', '标题和模块类型为必填项', 400);
      }

      const strategy = await prisma.strategy.create({
        data: {
          title,
          moduleType,
          coreProblem: coreProblem || null,
          enterpriseId: user.enterpriseId!,
          departmentId: departmentId || null,
        },
        include: {
          department: true,
        },
      });

      return successResponse(strategy);
    } catch (error) {
      console.error('Error creating strategy:', error);
      return errorFromCode('STR_CREATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
