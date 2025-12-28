import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { createDepartmentSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET: List all departments for the current enterprise
export const GET = withAuth(
  async ({ user }: AuthContext) => {
    try {
      // Fetch all departments, including member count
      const departments = await prisma.department.findMany({
        where: {
          enterpriseId: user.enterpriseId,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Format response to include memberCount alongside other fields
      const formattedDepartments = departments.map(dept => ({
        ...dept,
        memberCount: dept._count.users,
      }));

      return successResponse(formattedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      return errorFromCode('DEPT_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// POST: Create a new department
export const POST = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const body = await request.json();
      
      // Validate input using Zod schema
      const validation = validateBody(body, createDepartmentSchema);
      if (!validation.success) {
        return validation.error;
      }
      
      const { name, leader, parentId } = validation.data;

      const newDept = await prisma.department.create({
        data: {
          name,
          leader: leader || null,
          enterpriseId: user.enterpriseId!,
          parentId: parentId || null,
        },
      });

      return successResponse(newDept);
    } catch (error) {
      console.error('Error creating department:', error);
      return errorFromCode('DEPT_CREATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
