import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { updateDepartmentSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// PUT: Update a department
export const PUT = withAuth(
  async ({ user, request }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '部门ID为必填项');
      }

      const body = await request.json();
      
      // Validate input using Zod schema
      const validation = validateBody(body, updateDepartmentSchema);
      if (!validation.success) {
        return validation.error;
      }
      
      const { name, leader } = validation.data;

      const updatedDept = await prisma.department.update({
        where: {
          id: id,
          enterpriseId: user.enterpriseId,
        },
        data: {
          name,
          leader,
        },
      });

      return successResponse(updatedDept);
    } catch (error) {
      console.error('Error updating department:', error);
      return errorFromCode('DEPT_UPDATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// DELETE: Delete a department
export const DELETE = withAuth(
  async ({ user }: AuthContext, params?: { params: Record<string, string> }) => {
    try {
      const id = params?.params?.id;
      if (!id) {
        return errorFromCode('VALIDATION_MISSING_FIELD', undefined, '部门ID为必填项');
      }

      await prisma.department.delete({
        where: {
          id: id,
          enterpriseId: user.enterpriseId,
        },
      });

      return successResponse({ deleted: true });
    } catch (error) {
      console.error('Error deleting department:', error);
      // Handle Prisma FK error (P2003) commonly
      if ((error as { code?: string }).code === 'P2003') {
        return errorResponse('DEPT_004', '无法删除有成员或子部门的部门', 400, error);
      }
      return errorFromCode('DEPT_DELETE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
