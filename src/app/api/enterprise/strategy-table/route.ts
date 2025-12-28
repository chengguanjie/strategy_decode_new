import { prisma } from '@/lib/prisma';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { strategyTableDataSchema, strategyTableQuerySchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/validate';
import { successResponse, errorFromCode, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET: 获取战略表格数据
 * 
 * Query params:
 * - tableType: 表格类型 (financial, market, value, process, team, review, department_strategy)
 * - departmentId: 部门ID (可选)
 */
export const GET = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const tableType = searchParams.get('tableType');
      const departmentId = searchParams.get('departmentId');

      // Validate query params
      const queryValidation = strategyTableQuerySchema.safeParse({
        tableType,
        departmentId: departmentId || undefined
      });

      if (!queryValidation.success) {
        return errorResponse(
          'VAL_001',
          queryValidation.error.issues[0]?.message || 'tableType为必填项',
          400
        );
      }

      const validatedQuery = queryValidation.data;

      // 构建查询条件 - departmentId 已通过 schema 规范化为空字符串
      const queryCondition = {
        enterpriseId: user.enterpriseId!,
        departmentId: validatedQuery.departmentId, // 已规范化，直接使用
        tableType: validatedQuery.tableType,
      };

      console.log('[GET strategy-table] 查询条件:', queryCondition);

      const data = await prisma.strategyTableData.findUnique({
        where: {
          enterpriseId_departmentId_tableType: queryCondition,
        },
      });

      console.log('[GET strategy-table] 查询结果:', data ? {
        id: data.id,
        tableType: data.tableType,
        departmentId: data.departmentId,
        dataLength: data.data?.length,
        version: data.version,
      } : '未找到数据');

      if (!data) {
        return successResponse({
          exists: false,
          tableType: validatedQuery.tableType,
          departmentId: validatedQuery.departmentId || null
        });
      }

      return successResponse({
        exists: true,
        id: data.id,
        tableType: data.tableType,
        departmentId: data.departmentId,
        columns: JSON.parse(data.columns),
        data: JSON.parse(data.data),
        rowHeights: data.rowHeights ? JSON.parse(data.rowHeights) : {},
        version: data.version,
        updatedAt: data.updatedAt,
      });
    } catch (error) {
      console.error('Error fetching strategy table data:', error);
      return errorFromCode('STBL_LIST_FAILED', error);
    }
  },
  { requireEnterprise: true }
);

/**
 * POST: 保存战略表格数据
 * 
 * Body:
 * - tableType: 表格类型
 * - departmentId: 部门ID (可选)
 * - columns: 列定义数组
 * - data: 表格数据数组
 * - rowHeights: 行高配置 (可选)
 */
export const POST = withAuth(
  async ({ user, request }: AuthContext) => {
    try {
      const body = await request.json();

      // Validate input using Zod schema
      const validation = validateBody(body, strategyTableDataSchema);
      if (!validation.success) {
        return validation.error;
      }

      const { tableType, departmentId, columns, data, rowHeights } = validation.data;

      // 构建upsert条件 - departmentId 已通过 schema 规范化为空字符串
      const upsertCondition = {
        enterpriseId: user.enterpriseId!,
        departmentId, // 已规范化，直接使用
        tableType,
      };

      console.log('[POST strategy-table] 保存条件:', upsertCondition);
      console.log('[POST strategy-table] 数据摘要:', {
        columnsCount: columns.length,
        dataRowsCount: data.length,
        hasRowHeights: !!rowHeights,
      });

      // Use upsert to create or update
      const result = await prisma.strategyTableData.upsert({
        where: {
          enterpriseId_departmentId_tableType: {
            enterpriseId: user.enterpriseId!,
            departmentId, // 已规范化，直接使用
            tableType,
          },
        },
        update: {
          columns: JSON.stringify(columns),
          data: JSON.stringify(data),
          rowHeights: rowHeights ? JSON.stringify(rowHeights) : null,
          version: { increment: 1 },
        },
        create: {
          enterpriseId: user.enterpriseId!,
          departmentId, // 已规范化，直接使用
          tableType,
          columns: JSON.stringify(columns),
          data: JSON.stringify(data),
          rowHeights: rowHeights ? JSON.stringify(rowHeights) : null,
          createdBy: user.userId,
        },
      });

      console.log('[POST strategy-table] 保存成功:', {
        id: result.id,
        version: result.version,
        tableType: result.tableType,
        departmentId: result.departmentId,
      });

      return successResponse({
        id: result.id,
        version: result.version,
        updatedAt: result.updatedAt,
      }, '保存成功');
    } catch (error) {
      console.error('[POST strategy-table] 保存失败:', error);
      return errorFromCode('STBL_SAVE_FAILED', error);
    }
  },
  { requireEnterprise: true }
);
