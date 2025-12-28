/**
 * 数据库修复脚本：将 strategy_table_data 表中的 NULL departmentId 转换为空字符串
 *
 * 运行方式: npx ts-node scripts/fix-null-department-id.ts
 *
 * 背景：
 * - 唯一约束 [enterpriseId, departmentId, tableType] 中，NULL 和 '' 被视为不同值
 * - 这可能导致同一记录的 NULL 和 '' 版本共存
 * - 此脚本将所有 NULL departmentId 更新为 ''，确保数据一致性
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始修复 strategy_table_data 表中的 NULL departmentId...\n');

  // 查找所有 departmentId 为 NULL 的记录
  const recordsWithNull = await prisma.strategyTableData.findMany({
    where: {
      departmentId: null,
    },
    select: {
      id: true,
      enterpriseId: true,
      departmentId: true,
      tableType: true,
    },
  });

  console.log(`找到 ${recordsWithNull.length} 条 departmentId 为 NULL 的记录`);

  if (recordsWithNull.length === 0) {
    console.log('\n无需修复，所有记录已使用空字符串');
    return;
  }

  // 检查是否存在冲突（同一组合的 NULL 和 '' 版本都存在）
  const conflicts: typeof recordsWithNull = [];

  for (const record of recordsWithNull) {
    const existingEmptyString = await prisma.strategyTableData.findUnique({
      where: {
        enterpriseId_departmentId_tableType: {
          enterpriseId: record.enterpriseId,
          departmentId: '',
          tableType: record.tableType,
        },
      },
    });

    if (existingEmptyString) {
      conflicts.push(record);
      console.log(`⚠️ 冲突发现: enterpriseId=${record.enterpriseId}, tableType=${record.tableType}`);
      console.log(`   - NULL 版本 ID: ${record.id}`);
      console.log(`   - '' 版本 ID: ${existingEmptyString.id}`);
    }
  }

  if (conflicts.length > 0) {
    console.log(`\n发现 ${conflicts.length} 条冲突记录，需要手动处理或删除旧的 NULL 版本`);
    console.log('建议：删除 NULL 版本（较旧），保留 "" 版本（较新）\n');

    // 删除冲突的 NULL 版本
    for (const conflict of conflicts) {
      console.log(`删除冲突记录 ID: ${conflict.id}`);
      await prisma.strategyTableData.delete({
        where: { id: conflict.id },
      });
    }
    console.log(`已删除 ${conflicts.length} 条冲突的 NULL 版本记录\n`);
  }

  // 更新剩余的 NULL 记录为 ''（逐条处理，避免唯一约束冲突）
  const remainingNulls = recordsWithNull.filter(r => !conflicts.find(c => c.id === r.id));

  if (remainingNulls.length > 0) {
    console.log(`更新 ${remainingNulls.length} 条记录的 departmentId 从 NULL 改为 ''...`);

    let successCount = 0;
    let skipCount = 0;

    for (const record of remainingNulls) {
      // 再次检查是否存在空字符串版本（可能在之前的循环中创建）
      const existingEmptyString = await prisma.strategyTableData.findUnique({
        where: {
          enterpriseId_departmentId_tableType: {
            enterpriseId: record.enterpriseId,
            departmentId: '',
            tableType: record.tableType,
          },
        },
      });

      if (existingEmptyString) {
        // 如果空字符串版本已存在，删除 NULL 版本
        console.log(`跳过并删除冲突记录 ID: ${record.id} (enterpriseId=${record.enterpriseId}, tableType=${record.tableType})`);
        await prisma.strategyTableData.delete({
          where: { id: record.id },
        });
        skipCount++;
      } else {
        // 更新 NULL 为 ''
        await prisma.strategyTableData.update({
          where: { id: record.id },
          data: { departmentId: '' },
        });
        successCount++;
      }
    }

    console.log(`成功更新 ${successCount} 条记录，删除 ${skipCount} 条冲突记录\n`);
  }

  // 验证结果
  const remainingWithNull = await prisma.strategyTableData.count({
    where: {
      departmentId: null,
    },
  });

  if (remainingWithNull === 0) {
    console.log('✅ 修复完成！所有 departmentId 现在都使用空字符串');
  } else {
    console.log(`❌ 仍有 ${remainingWithNull} 条记录的 departmentId 为 NULL，请检查`);
  }
}

main()
  .catch((e) => {
    console.error('修复脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
