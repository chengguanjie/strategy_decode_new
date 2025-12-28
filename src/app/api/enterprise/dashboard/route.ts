import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { successResponse, errorFromCode } from '@/lib/api-response';

interface Department {
  id: string;
  name: string;
}

interface MetricTrend {
  id: string;
  departmentId: string;
  metricName: string;
  monthData: string;
}

export const dynamic = 'force-dynamic';

// GET: Fetch dashboard data
export const GET = withAuth(
  async ({ user }: AuthContext) => {
    try {
      const cards = await prisma.dashboardCard.findMany({
        where: { enterpriseId: user.enterpriseId },
        orderBy: { sortOrder: 'asc' },
      });

      const departments = await prisma.department.findMany({
        where: { enterpriseId: user.enterpriseId },
      });

      const currentYear = new Date().getFullYear();
      const trends = await prisma.departmentMetricTrend.findMany({
        where: {
          enterpriseId: user.enterpriseId,
          year: currentYear,
        },
      });

      const departmentTrends = departments
        .map((dept: Department) => {
          const deptTrends = trends.filter((t: MetricTrend) => t.departmentId === dept.id);
          return {
            departmentId: dept.id,
            departmentName: dept.name,
            metrics: deptTrends.map((t: MetricTrend) => ({
              name: t.metricName,
              data: JSON.parse(t.monthData || '[]'),
            })),
          };
        })
        .filter((d: { metrics: unknown[] }) => d.metrics.length > 0);

      return successResponse({
        cards,
        departmentTrends,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      return errorFromCode('DASH_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
