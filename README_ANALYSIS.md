# 战略绩效项目分析 - 文档导航

## 文档概览

本项目包含3份详细的分析文档，共1806行代码文档，帮助您全面理解战略绩效系统的架构和数据结构。

### 📄 文档清单

| 文档名称 | 文件大小 | 行数 | 主要内容 |
|---------|---------|------|---------|
| **PROJECT_STRUCTURE_ANALYSIS.md** | 18K | 760行 | 项目全面结构分析、数据库模型、各模块详细设计 |
| **QUICK_REFERENCE.md** | 8.4K | 295行 | 快速参考表、常见操作、调试技巧、性能优化 |
| **DATA_STRUCTURES.md** | 18K | 751行 | TypeScript类型定义、API格式、枚举常量、存储结构 |

---

## 快速导航指南

### 场景1: 快速理解项目结构

**步骤**:
1. 阅读本文档的"项目架构概览"部分
2. 打开 `QUICK_REFERENCE.md` 查看"模块对应关系速查表"
3. 参考"文件结构导航"了解代码位置

**预计时间**: 15分钟

---

### 场景2: 修改表格列或数据

**步骤**:
1. 打开 `QUICK_REFERENCE.md` 中的"快速定位问题"
2. 找到相应的INITIAL_COLUMNS和INITIAL_DATA
3. 参考 `DATA_STRUCTURES.md` 中的表格数据结构定义
4. 修改后验证数据类型是否正确

**相关文件**:
- src/components/strategy/*.tsx
- src/components/strategy/*.scss

**预计时间**: 10-30分钟

---

### 场景3: 集成新的AI模型或功能

**步骤**:
1. 查看 `PROJECT_STRUCTURE_ANALYSIS.md` 中的"AI配置模块"
2. 打开 `QUICK_REFERENCE.md` 中的"集成新的AI模型"
3. 参考 `DATA_STRUCTURES.md` 中的AIConfig和API格式

**相关文件**:
- src/components/ai/AISidebar.tsx
- 后端API: /api/ai/chat

**预计时间**: 30-45分钟

---

### 场景4: 添加新的表格模块

**步骤**:
1. 参考 `QUICK_REFERENCE.md` 中的"添加新的表格模块"
2. 选择相似的现有组件作为模板 (如DepartmentStrategyTable.tsx)
3. 参考 `DATA_STRUCTURES.md` 中的表格数据结构
4. 在StrategyDetail.tsx中添加条件分支
5. 在StrategyMap.tsx中添加导航节点

**相关文件**:
- src/components/strategy/ (复制并修改)
- src/lib/constants.ts (添加INITIAL_CONTENT)

**预计时间**: 45分钟 - 1小时

---

### 场景5: 将表格数据持久化到数据库

**步骤**:
1. 查看 `PROJECT_STRUCTURE_ANALYSIS.md` 中的"客户结构特殊处理"
2. 参考 CustomerStructureTabs.tsx 中的API集成实现
3. 查看 `DATA_STRUCTURES.md` 中的API格式和CustomerStructureData模型
4. 创建对应的Route Handler
5. 在schema.prisma中定义数据表

**参考实现**: CustomerStructureTabs.tsx (行140-164)

**预计时间**: 1-2小时

---

### 场景6: 调试或优化性能

**步骤**:
1. 打开 `QUICK_REFERENCE.md` 中的"性能优化关键点"和"调试技巧"
2. 查看 `PROJECT_STRUCTURE_ANALYSIS.md` 中的"关键技术特性"
3. 用浏览器开发者工具检查localStorage和network

**优化建议**:
- 防抖保存: 500ms (已实现in CustomerStructureTabs)
- 聊天历史限制: 50条 (已实现)
- 部门树缓存: useMemo (已实现)

**预计时间**: 15-45分钟

---

## 项目架构概览

### 四大核心模块

```
战略绩效系统
├── 战略解码 (Strategy Decoding)
│   ├── 经营目标
│   ├── 市场选择
│   ├── 客户结构 (API持久化)
│   ├── 价值竞争
│   └── [部门级]
│       ├── 战略承接
│       ├── 业务流程
│       ├── 团队效能
│       └── 复盘管理
│
├── AI配置 (AI Configuration)
│   └── AI侧边栏 (多模型支持)
│
├── 组织设置 (Organization Settings)
│   ├── AI配置面板
│   ├── 账号管理
│   └── 个人中心
│
└── 绩效复盘 (Performance Review)
    ├── 指标总览
    ├── 月度统计
    └── 人才盘点 (九宫格)
```

---

## 关键技术栈

| 技术 | 用途 | 说明 |
|-----|------|------|
| **Next.js 14** | 全栈框架 | App Router + Server Components |
| **React 18** | UI框架 | 函数式组件 + Hooks |
| **TypeScript** | 类型系统 | 严格类型检查 |
| **Ant Design 5** | UI组件库 | 表格、表单、模态框等 |
| **Recharts** | 数据可视化 | 趋势图表 |
| **react-resizable** | 表格编辑 | 列宽和行高拖拽 |
| **Prisma** | ORM | MySQL数据库 |
| **SCSS** | 样式 | 模块化样式管理 |

---

## 数据流概览

### 战略编辑流程
```
用户输入 
  ↓
React State (useState)
  ↓
本地表格组件 (MarketSelectionTable等)
  ↓
用户可选: 调用AI辅助
  ↓
AI返回建议 → 用户确认应用
  ↓
更新表格数据
  ↓
[可选] 保存到数据库 (API调用)
```

### AI聊天流程
```
用户输入消息
  ↓
验证AI配置 (localStorage)
  ↓
POST /api/ai/chat (含历史消息)
  ↓
AI处理 + 返回回复 + 可选表格更新
  ↓
更新聊天历史 (localStorage)
  ↓
显示消息 + [可选] 应用表格更新
```

---

## 核心文件地图

### 必看文件 (5个)

1. **src/app/enterprise/page.tsx** ⭐⭐⭐
   - 主容器，包含菜单、导航、各模块渲染逻辑
   - 行数: 749 (需要理解的核心文件)

2. **src/components/strategy/StrategyDetail.tsx** ⭐⭐⭐
   - 战略详情容器，根据content.title动态渲染表格
   - 行数: 737 (关键的路由和条件渲染)

3. **src/components/ai/AISidebar.tsx** ⭐⭐⭐
   - AI助手，包含聊天、配置、历史
   - 行数: 570 (AI功能的完整实现)

4. **src/components/strategy/CustomerStructureTabs.tsx** ⭐⭐⭐
   - 客户结构表格，支持API保存
   - 行数: 558 (数据持久化的示例)

5. **src/components/strategy/PerformanceReview.tsx** ⭐⭐
   - 绩效复盘，包含指标、月度、人才管理
   - 行数: 720 (复盘模块的完整实现)

### 参考文件 (其他表格)

- MarketSelectionTable.tsx - 基础表格模板
- ValueCompetitionTable.tsx - 支持行合并的表格
- DepartmentStrategyTable.tsx - 部门级表格
- BusinessProcessTable.tsx - 流程表格
- TeamEfficiencyTable.tsx - 效能表格
- ReviewManagementTable.tsx - 复盘矩阵

### 关键常量

- **prisma/schema.prisma** - 数据库模型定义 (178行)
- **src/lib/constants.ts** - INITIAL_CONTENT (假设存在)
- **src/types/index.ts** - BlockContent, DepartmentNode等类型

---

## 常见问题快速解答

### Q1: 如何修改市场选择表格的列？

**A**: 
1. 打开 `src/components/strategy/MarketSelectionTable.tsx`
2. 找到 `const INITIAL_COLUMNS` (行117-123)
3. 修改对应的列定义，参考 `DATA_STRUCTURES.md` 中的ColumnDef结构

---

### Q2: 如何添加新的AI模型？

**A**:
1. 打开 `src/components/ai/AISidebar.tsx`
2. 找到 `const AI_MODELS` (行17-27)
3. 添加新模型: `{ value: 'provider/model-name', label: 'Display Name' }`

---

### Q3: 如何保存客户结构数据到数据库？

**A**:
1. 参考 `src/components/strategy/CustomerStructureTabs.tsx` 中的 `saveData()` 函数
2. 创建API Route: `src/app/api/enterprise/customer-structure/route.ts`
3. 实现POST和GET方法，连接Prisma ORM

---

### Q4: AI配置保存到哪里？

**A**:
- 临时存储: localStorage (键: 'ai_config')
- 本地持久: 可选保存到数据库 (需实现API)
- 当前实现: 仅localStorage (足够演示)

---

### Q5: 如何调试AI聊天？

**A**:
在浏览器控制台运行:
```javascript
// 查看AI配置
console.log(JSON.parse(localStorage.getItem('ai_config')))

// 查看聊天历史
console.log(JSON.parse(localStorage.getItem('ai_chat_history')))

// 清空重置
localStorage.removeItem('ai_config')
localStorage.removeItem('ai_chat_history')
```

---

## 使用建议

### 阅读顺序 (推荐)

**第一遍 (快速概览, 30分钟)**:
1. 本文档 (README_ANALYSIS.md)
2. QUICK_REFERENCE.md 的"模块对应关系速查表"
3. QUICK_REFERENCE.md 的"文件结构导航"

**第二遍 (深入学习, 1-2小时)**:
1. PROJECT_STRUCTURE_ANALYSIS.md 的"战略解码模块"
2. PROJECT_STRUCTURE_ANALYSIS.md 的"AI配置模块"
3. PROJECT_STRUCTURE_ANALYSIS.md 的"绩效复盘模块"

**第三遍 (开发参考, 按需查阅)**:
1. DATA_STRUCTURES.md (需要时查阅类型定义)
2. QUICK_REFERENCE.md (快速定位问题)
3. 对应的源代码文件

---

## 相关命令

### 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

### 数据库操作
```bash
# 同步模型到数据库
npx prisma migrate dev --name <description>

# 查看Prisma Studio
npx prisma studio
```

### 代码质量
```bash
# TypeScript检查
npm run type-check

# ESLint
npm run lint
```

---

## 扩展指南

### 想要实现的常见功能

#### 1. 导出表格为Excel

**文件**: src/components/strategy/ (任意表格组件)

**步骤**:
1. 安装: `npm install xlsx`
2. 在表格头部添加导出按钮
3. 实现导出逻辑:
```typescript
import * as XLSX from 'xlsx';

const handleExport = () => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, "table.xlsx");
}
```

---

#### 2. 实现表格版本控制

**数据库**: 在schema.prisma中添加StrategyHistory表

**字段**:
- id, strategyId, content, version, createdAt, createdBy

**实现**:
- 每次保存时创建新版本记录
- 提供版本对比功能

---

#### 3. 添加权限管理

**调整**:
- 在renderMainView()中检查用户角色
- 根据role隐藏/禁用某些菜单
- API端点添加权限验证

---

## 支持和反馈

### 文档更新时间

- 最后更新: 2025-12-26
- 项目版本: 基于7573604 commit (feat: 战略绩效系统功能完善)

### 如发现问题

1. 检查对应的源代码文件是否有更新
2. 查看git log了解最近的更改
3. 参考相关文档的"关键技术特性"部分

---

## 下一步建议

### 短期 (本周)
- [ ] 阅读完整的PROJECT_STRUCTURE_ANALYSIS.md
- [ ] 打开核心文件与文档对照学习
- [ ] 修改一个表格列作为练习

### 中期 (本月)
- [ ] 实现一个新的表格模块
- [ ] 将客户结构数据持久化到数据库
- [ ] 添加数据导出功能

### 长期 (本季)
- [ ] 实现权限管理系统
- [ ] 添加战略版本控制
- [ ] 实现团队协作功能
- [ ] 开发高级报表和分析

---

## 许可证和归属

项目: 战略绩效系统 (Strategy Performance Management System)

所有分析文档均基于对项目源代码的详细阅读和分类整理。

