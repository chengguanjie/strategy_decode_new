# 战略绩效项目 - 快速参考指南

## 模块对应关系速查表

### 一、战略解码模块 (Strategy Decoding)

| 功能模块 | 组件文件 | 表格类型 | 核心字段 | 是否持久化 |
|---------|---------|---------|---------|----------|
| 经营目标 | StrategyDetail.tsx | 动态财务表 | 财务指标/年份/数值 | 客户端(State) |
| 市场选择 | MarketSelectionTable.tsx | 市场矩阵 | 业务类型/市场/定位/增长点 | 客户端(State) |
| 客户结构 | CustomerStructureTabs.tsx | 3个子表 | 客户画像/盘点/组合规划 | API (500ms防抖) |
| 价值竞争 | ValueCompetitionTable.tsx | 竞争矩阵 | 客户类型/维度/对标/策略 | 客户端(State) |
| 战略承接 | DepartmentStrategyTable.tsx | 承接表 | 战略目标/承接点/指标/差距 | 客户端(State) |
| 业务流程 | BusinessProcessTable.tsx | 流程表 | 流程/问题/原因/对策 | 客户端(State) |
| 团队效能 | TeamEfficiencyTable.tsx | 效能表 | 维度/场景/问题/AI赋能 | 客户端(State) |
| 复盘管理 | ReviewManagementTable.tsx | 复盘矩阵 | 维度/内容/问题/对策 | 客户端(State) |

---

### 二、AI配置模块 (AI Configuration)

| 功能项 | 配置字段 | 数据类型 | 存储位置 | 说明 |
|-------|---------|---------|---------|------|
| API基地址 | apiBaseUrl | string | localStorage | 默认: router.shengsuanyun.com/api/v1 |
| API密钥 | apiKey | string | localStorage | 密码框输入 |
| 模型选择 | model | string | localStorage | 9种模型可选 |
| 背景信息 | contextInfo | string | localStorage | 企业背景，最多2000字 |
| 聊天历史 | chatHistory | ChatHistory[] | localStorage | 最多50条 |

**支持的AI模型**:
1. Claude Opus 4.5
2. Claude Sonnet 4.5 (Thinking)
3. Claude Haiku 4.5 (Thinking)
4. Gemini 3 Pro Preview
5. Gemini 3 Flash
6. GPT-5.2
7. GPT-5.1 Codex Max
8. DeepSeek V3.2 Think
9. GLM 4.7

---

### 三、组织设置模块 (Organization Settings)

| 管理功能 | 位置 | 关键操作 | 数据模型 |
|---------|------|---------|---------|
| AI配置 | /enterprise (aiconfig菜单) | 保存/测试连接 | AIConfig |
| 账号管理 | /enterprise (account菜单) | 添加/删除管理员 | EnterpriseUser[] |
| 个人中心 | /enterprise (profile菜单) | 查看个人信息 | User |
| 部门管理 | API: /api/enterprise/departments | 获取部门树 | Department[] |

---

### 四、绩效复盘模块 (Performance Review)

| 标签页 | 组件 | 核心功能 | 数据模型 |
|-------|------|---------|---------|
| 指标总览 | PerformanceReview.tsx | 部门指标管理 | IndicatorData[] |
| 月度统计 | LineChart + MonthlyDataTable | 月度数据和趋势 | MonthlyData[] + 趋势图 |
| 复盘分析 | ReviewAnalysisTable | 差距/原因/对策分析 | ReviewAnalysisData[] |
| 人才盘点 | TalentTable + NineGrid | 人员评分和矩阵分类 | TalentData[] + NineGridData |

---

## 关键数据流

### 战略流程图
```
用户输入 → StrategyDetail (渲染) → 对应表格组件 → 本地State → 展示
         ↓
     AI配置检验 → AI侧边栏 → API调用 → 返回建议 → 应用更新
```

### 客户结构特殊流程 (API集成)
```
初始化 → GET /api/enterprise/customer-structure
          ↓
        加载数据到State
          ↓
      用户编辑 (onChange)
          ↓
    触发saveData (500ms防抖)
          ↓
    POST /api/enterprise/customer-structure
          ↓
      后端保存到CustomerStructureData表
```

### AI聊天流程
```
用户输入 → 本地验证AI配置
          ↓
    POST /api/ai/chat (messages + context + config)
          ↓
    AI返回content + 可选的tableUpdates
          ↓
    更新chatHistory (localStorage) + 展示消息
          ↓
    如果有tableUpdates → 显示应用按钮
          ↓
    用户确认 → onApplyUpdates回调
```

---

## 文件结构导航

```
src/
├── app/
│   ├── enterprise/
│   │   └── page.tsx ⭐ 主页面 (包含所有菜单和导航)
│   ├── admin/
│   └── layout.tsx
│
├── components/
│   ├── strategy/ ⭐ 战略解码模块
│   │   ├── StrategyDetail.tsx (主组件)
│   │   ├── StrategyMap.tsx (导航地图)
│   │   ├── MarketSelectionTable.tsx
│   │   ├── CustomerStructureTabs.tsx (API持久化)
│   │   ├── ValueCompetitionTable.tsx
│   │   ├── DepartmentStrategyTable.tsx
│   │   ├── BusinessProcessTable.tsx
│   │   ├── TeamEfficiencyTable.tsx
│   │   ├── ReviewManagementTable.tsx
│   │   ├── PerformanceReview.tsx (绩效复盘)
│   │   └── *.scss (样式文件)
│   │
│   └── ai/ ⭐ AI配置模块
│       └── AISidebar.tsx (AI助手)
│
├── lib/
│   └── constants.ts (INITIAL_CONTENT - 各模块的初始数据)
│
├── types/
│   └── index.ts (BlockContent, DepartmentNode等类型定义)
│
└── prisma/
    └── schema.prisma ⭐ 数据库模型
```

---

## 快速定位问题

### 如果要修改...

**表格列定义** 
→ 对应组件中搜索 `INITIAL_COLUMNS`

**表格初始数据**
→ 对应组件中搜索 `INITIAL_DATA` 

**AI欢迎消息**
→ AISidebar.tsx 中 `getWelcomeMessage()` 函数

**AI模型列表**
→ AISidebar.tsx 中 `AI_MODELS` 常量

**客户结构的持久化逻辑**
→ CustomerStructureTabs.tsx 中 `saveData()` 函数和 `useEffect`

**表格操作处理**
→ 各表格组件中的 `handleAddRow`, `handleDeleteColumn` 等函数

**部门导航树**
→ enterprise/page.tsx 中 `buildTreeData()` 和 `fetchDepartments()` 

**菜单项和路由**
→ enterprise/page.tsx 中 `activeMenu` 状态和 `renderMainView()` 函数

---

## 常见操作速查

### 添加新的表格模块

1. 在 `src/components/strategy/` 创建新组件 `NewTable.tsx`
2. 复制 `DepartmentStrategyTable.tsx` 结构
3. 修改 `INITIAL_COLUMNS` 和 `INITIAL_DATA`
4. 在 `StrategyDetail.tsx` 中添加条件分支
5. 在 `StrategyMap.tsx` 中添加导航节点

### 修改表格列

1. 找到对应组件的 `INITIAL_COLUMNS`
2. 修改 title/dataIndex/width
3. 如果要修改行数据，同时修改 `INITIAL_DATA`

### 集成新的AI模型

1. AISidebar.tsx 中 `AI_MODELS` 数组添加新项
2. 格式: `{ value: 'provider/model-name', label: 'Display Name' }`

### 修改AI欢迎消息

1. AISidebar.tsx 中 `getWelcomeMessage()` 函数
2. 在 switch 语句中添加对应的 case

### 保存表格数据到数据库

1. 在表格组件中添加 API 调用 (如 CustomerStructureTabs 示例)
2. 创建对应的 route handler: `/api/enterprise/{resource}`
3. 在 schema.prisma 中定义数据表

---

## 性能优化关键点

| 优化项 | 实现方式 | 位置 |
|-------|---------|------|
| 防抖保存 | setTimeout 500ms | CustomerStructureTabs.tsx |
| 聊天历史限制 | slice(0, 50) | AISidebar.tsx |
| 部门树缓存 | useMemo + dependencies | StrategyMap.tsx |
| 表格行高缓存 | rowHeights state | 各表格组件 |

---

## 数据验证

### 表单验证位置
- AI配置: `aiConfigForm.validateFields()`
- 账号管理: `userForm.validateFields()`
- 各表格: onChange时即时验证

### 必填字段检查
- AI API Key: 必填 (在消息发送前检查)
- 企业名称: 必填
- 部门名称: 必填

---

## 测试数据

### 默认财务指标 (经营目标)
- 收入 (Revenue)
- 边界利润 (CM)
- 固定成本 (Fixed)
- 利润 (Profit)
- 应收账款 (AR)
- 库存 (Inventory)

### 默认团队效能维度 (5个)
1. 知识结构
2. 工作效率
3. 时间管理
4. 思维方式
5. 激情状态

### 默认复盘维度 (3个)
1. 数据分析
2. 复盘会议
3. 绩效辅导

---

## 调试技巧

### 查看localStorage数据
```javascript
console.log(localStorage.getItem('ai_config'))
console.log(localStorage.getItem('ai_chat_history'))
```

### 清空AI配置重置
```javascript
localStorage.removeItem('ai_config')
localStorage.removeItem('ai_chat_history')
```

### 查看当前选中的菜单
```javascript
console.log(activeMenu)
console.log(selectedId)
```

### 验证API配置是否生效
```javascript
// 在AISidebar.tsx中的handleTestConnection查看实现
```

---

## 联系信息和扩展指南

### 如果需要添加新模块
参考 `PROJECT_STRUCTURE_ANALYSIS.md` 中的"扩展点和改进建议"部分

### 如果要与数据库集成
参考 `CustomerStructureTabs.tsx` 中关于 API 调用的实现

### 如果要修改UI样式
查看对应组件的 `.scss` 文件，使用 SCSS 变量和 mixin

