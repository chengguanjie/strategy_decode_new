# Implementation Plan: 战略绩效系统诊断与改进

## Overview

本实施计划将项目诊断中识别的问题按优先级分解为可执行的任务，从安全加固开始，逐步完成数据持久化、代码重构、测试配置和性能优化。

## Tasks

- [x] 1. Phase 1: 安全加固
  - [x] 1.1 修复JWT_SECRET安全问题
    - 移除auth.ts中的默认JWT_SECRET值
    - 添加环境变量检查，缺失时抛出错误
    - 更新.env.example文件
    - _Requirements: 3.1, 3.5_

  - [x] 1.2 创建统一的API认证中间件
    - 创建lib/middleware/auth.ts
    - 实现withAuth高阶函数包装API路由
    - 支持角色权限检查
    - _Requirements: 3.1, 3.2_

  - [x] 1.3 为所有受保护API添加认证
    - 更新enterprise相关API使用认证中间件
    - 更新ai/chat API使用认证中间件
    - 验证所有端点的认证保护
    - _Requirements: 3.1, 3.3_

  - [x] 1.4 编写API认证属性测试
    - **Property 1: API认证一致性**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 1.5 实现输入验证框架
    - 安装并配置Zod
    - 创建通用验证schema
    - 为login/register API添加验证
    - _Requirements: 3.4, 4.3_

  - [x] 1.6 为关键API添加输入验证
    - customer-structure API验证
    - users API验证
    - departments API验证
    - _Requirements: 4.3, 8.3_

  - [x] 1.7 编写数据验证属性测试
    - **Property 3: 数据验证完整性**
    - **Validates: Requirements 4.3, 8.3**

- [x] 2. Checkpoint - 安全加固完成
  - 确保所有安全相关测试通过
  - 验证API认证正常工作
  - 如有问题请咨询用户

- [-] 3. Phase 2: API规范化
  - [x] 3.1 创建统一的API响应工具
    - 创建lib/api-response.ts
    - 实现successResponse和errorResponse函数
    - 定义错误码常量
    - _Requirements: 8.2, 8.3_

  - [x] 3.2 创建错误处理类
    - 创建lib/errors.ts
    - 实现AppError类
    - 定义标准错误码
    - _Requirements: 8.3_

  - [x] 3.3 重构现有API使用统一响应格式
    - 更新auth相关API
    - 更新enterprise相关API
    - 更新ai/chat API
    - _Requirements: 8.2_

  - [ ] 3.4 编写API响应格式属性测试
    - **Property 2: API响应格式一致性**
    - **Validates: Requirements 8.2, 8.3**

- [x] 4. Checkpoint - API规范化完成
  - 确保所有API响应格式一致
  - 验证错误处理正常工作
  - 如有问题请咨询用户

- [x] 5. Phase 3: 数据持久化
  - [x] 5.1 设计通用表格数据模型
    - 更新prisma/schema.prisma添加StrategyTableData模型
    - 运行prisma migrate
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 创建表格数据API
    - 创建api/enterprise/strategy-table/route.ts
    - 实现GET和POST方法
    - 支持按tableType和departmentId查询
    - _Requirements: 4.2, 4.3_

  - [x] 5.3 迁移FinancialTable组件
    - 添加数据加载和保存逻辑
    - 实现防抖保存
    - 保持向后兼容
    - _Requirements: 4.2_

  - [x] 5.4 迁移MarketSelectionTable组件
    - 添加数据加载和保存逻辑
    - 实现防抖保存
    - _Requirements: 4.2_

  - [x] 5.5 迁移ValueCompetitionTable组件
    - 添加数据加载和保存逻辑
    - 实现防抖保存
    - _Requirements: 4.2_

  - [x] 5.6 迁移部门级表格组件
    - DepartmentStrategyTable
    - BusinessProcessTable
    - TeamEfficiencyTable
    - ReviewManagementTable
    - _Requirements: 4.2_

- [x] 6. Checkpoint - 数据持久化完成
  - 验证所有表格数据正确保存和加载
  - 测试刷新页面数据不丢失
  - 如有问题请咨询用户

- [x] 7. Phase 4: 代码重构
  - [x] 7.1 拆分enterprise/page.tsx
    - 提取AIConfigPanel组件
    - 提取AccountManagement组件
    - 提取ProfilePanel组件
    - 简化主页面逻辑
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 重构StrategyDetail组件
    - 创建组件映射表替代条件渲染
    - 提取公共Header组件
    - 减少重复代码
    - _Requirements: 2.1, 2.2_

  - [x] 7.3 抽取公共表格Hook
    - 创建hooks/useEditableTable.ts
    - 实现列宽调整、行高调整、单元格编辑等通用逻辑
    - 重构表格组件使用公共Hook
    - _Requirements: 2.1_

  - [x] 7.4 提取配置常量
    - 将AI_MODELS移至constants.ts
    - 提取其他硬编码配置
    - _Requirements: 2.4_

- [x] 8. Checkpoint - 代码重构完成
  - 验证所有功能正常工作
  - 检查代码结构改进
  - 如有问题请咨询用户

- [x] 9. Phase 5: 测试配置
  - [x] 9.1 配置Jest测试框架
    - 安装Jest和相关依赖
    - 创建jest.config.js
    - 配置TypeScript支持
    - _Requirements: 7.1_

  - [x] 9.2 编写认证模块单元测试
    - 测试hashPassword
    - 测试comparePassword
    - 测试generateToken和verifyToken
    - _Requirements: 7.2_

  - [x] 9.3 编写API集成测试
    - 测试login API
    - 测试register API
    - 测试受保护API的认证
    - _Requirements: 7.2_

  - [x] 9.4 配置属性测试框架
    - 安装fast-check
    - 创建属性测试配置
    - _Requirements: 7.1_

- [x] 10. Checkpoint - 测试配置完成
  - 运行所有测试确保通过
  - 检查测试覆盖率
  - 如有问题请咨询用户

- [x] 11. Phase 6: 性能与可维护性优化
  - [x] 11.1 添加React.memo优化
    - 为StrategyDetail子组件添加memo
    - 为表格组件添加memo
    - _Requirements: 6.2_

  - [x] 11.2 配置ESLint严格规则
    - 更新.eslintrc配置
    - 添加TypeScript严格规则
    - 修复lint警告
    - _Requirements: 9.2_

  - [x] 11.3 配置Prettier
    - 创建.prettierrc配置
    - 格式化现有代码
    - _Requirements: 9.2_

  - [x] 11.4 配置Git Hooks
    - 安装husky和lint-staged
    - 配置pre-commit hook
    - _Requirements: 9.2_

  - [x] 11.5 添加代码注释
    - 为核心函数添加JSDoc注释
    - 为复杂逻辑添加说明注释
    - _Requirements: 9.1_

- [ ] 12. Final Checkpoint - 全部改进完成
  - 运行完整测试套件
  - 验证所有功能正常
  - 检查代码质量指标
  - 如有问题请咨询用户

## Notes

- 所有任务均为必需任务，确保全面的实施
- 每个Phase完成后都有Checkpoint，确保阶段性成果稳定
- 建议按顺序执行，因为后续任务可能依赖前置任务的成果
- 预计总工作量：约70小时（6周，每周约12小时）

