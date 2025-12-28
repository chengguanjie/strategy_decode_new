import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { customerStructureSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Query params schema
const querySchema = z.object({
  tableType: z.string().min(1, 'tableType不能为空'),
  departmentId: z.string().optional(),
});

// GET: Fetch customer structure data
export const GET = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const tableType = searchParams.get('tableType');
      const departmentId = searchParams.get('departmentId');

      // Validate query params
      const queryValidation = querySchema.safeParse({ tableType, departmentId });
      if (!queryValidation.success) {
        return errorResponse(
          'VAL_001',
          queryValidation.error.issues[0]?.message || 'tableType为必填项',
          400
        );
      }

      const validatedQuery = queryValidation.data;

      const data = await prisma.customerStructureData.findUnique({
        where: {
          enterpriseId_departmentId_tableType: {
            enterpriseId: user.enterpriseId!,
            departmentId: validatedQuery.departmentId || '',
            tableType: validatedQuery.tableType,
          },
        },
      });

      if (!data) {
        return successResponse({ exists: false });
      }

      return successResponse({
        exists: true,
        columns: JSON.parse(data.columns),
        data: JSON.parse(data.data),
        rowHeights: data.rowHeights ? JSON.parse(data.rowHeights) : {},
      });
    } catch (error) {
      console.error('Error fetching customer structure data:', error);
      return errorFromCode('CUST_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

// POST: Save customer structure data
export const POST = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const body = await request.json();
      
      // Validate input using Zod schema
      const validation = validateBody(body, customerStructureSchema);
      if (!validation.success) {
        return validation.error;
      }
      
      const { tableType, departmentId, columns, data, rowHeights } = validation.data;

      const result = await prisma.customerStructureData.upsert({
        where: {
          enterpriseId_departmentId_tableType: {
            enterpriseId: user.enterpriseId!,
            departmentId: departmentId || '',
            tableType,
          },
        },
        update: {
          columns: JSON.stringify(columns),
          data: JSON.stringify(data),
          rowHeights: rowHeights ? JSON.stringify(rowHeights) : null,
        },
        create: {
          enterpriseId: user.enterpriseId!,
          departmentId: departmentId || null,
          tableType,
          columns: JSON.stringify(columns),
          data: JSON.stringify(data),
          rowHeights: rowHeights ? JSON.stringify(rowHeights) : null,
        },
      });

      return successResponse({ id: result.id });
    } catch (error) {
      console.error('Error saving customer structure data:', error);
      return errorFromCode('CUST_UPDATE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
