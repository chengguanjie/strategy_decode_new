# 战略绩效项目 - 全面结构分析

## 一、项目概览
战略绩效系统是一个企业级的战略管理和绩效评估平台，包含战略解码、AI配置、组织设置和绩效复盘四大核心模块。

---

## 二、数据库模型结构 (Prisma Schema)

### 核心数据表及字段

#### 1. User (用户)
```
- id: String @id (CUID)
- email: String @unique
- password: String
- name: String
- role: UserRole (PLATFORM_ADMIN | ENTERPRISE_ADMIN | MANAGER | EMPLOYEE)
- avatar: String?
- position: String?
- enterpriseId: String? (FK)
- departmentId: String? (FK)
- createdAt: DateTime
- updatedAt: DateTime
```

#### 2. Enterprise (企业)
```
- id: String @id (CUID)
- name: String
- code: String @unique
- logo: String?
- status: EnterpriseStatus (ACTIVE | INACTIVE | SUSPENDED)
- createdAt: DateTime
- updatedAt: DateTime
- Relations: users[], departments[], strategies[]
```

#### 3. Department (部门)
```
- id: String @id (CUID)
- name: String
- leader: String?
- parentId: String? (支持多级层级)
- enterpriseId: String (FK)
- createdAt: DateTime
- updatedAt: DateTime
- Relations: enterprise, parent (self), children (self), users[], strategies[]
```

#### 4. Strategy (战略)
```
- id: String @id (CUID)
- title: String
- moduleType: String
- coreProblem: String? (Text)
- enterpriseId: String (FK)
- departmentId: String? (FK)
- createdAt: DateTime
- updatedAt: DateTime
- Relations: marketData[], frameworks[], winningPoints[], actionPlans[], keyMetrics[]
```

#### 5. MarketSelection (市场选择)
```
- id: String @id
- strategyId: String (FK)
- marketSegment: String? (Text)
- corePositioning: String? (Text)
- developmentTrend: String? (Text)
- growthPoint: String? (Text)
- internalRequirement: String? (Text)
- sortOrder: Int
- createdAt: DateTime
- updatedAt: DateTime
```

#### 6. StrategyFramework (战略框架)
```
- id: String @id
- strategyId: String (FK)
- name: String
- sortOrder: Int
- createdAt: DateTime
```

#### 7. WinningPoint (必赢之战)
```
- id: String @id
- strategyId: String (FK)
- content: String (Text)
- sortOrder: Int
- createdAt: DateTime
```

#### 8. ActionPlan (行动计划)
```
- id: String @id
- strategyId: String (FK)
- content: String (Text)
- status: String (default: "pending")
- sortOrder: Int
- createdAt: DateTime
```

#### 9. KeyMetric (衡量指标)
```
- id: String @id
- strategyId: String (FK)
- name: String
- target: String?
- current: String?
- sortOrder: Int
- createdAt: DateTime
```

#### 10. CustomerStructureData (客户结构数据)
```
- id: String @id
- enterpriseId: String
- departmentId: String?
- tableType: String
- columns: String (LongText - JSON)
- data: String (LongText - JSON)
- rowHeights: String? (Text - JSON)
- createdAt: DateTime
- updatedAt: DateTime
- Unique: [enterpriseId, departmentId, tableType]
```

---

## 三、战略解码模块 (Strategy Decoding)

### 3.1 核心组件结构

#### StrategyDetail.tsx (主组件)
**职责**: 根据content.title动态渲染不同的战略模块

**Props Interface**:
```typescript
interface StrategyDetailProps {
  content: BlockContent;
  onAddPoint?: (text: string) => void;
  onAddAction?: (text: string) => void;
  onAddMetric?: (text: string) => void;
  departmentName?: string;
}
```

**BlockContent数据结构** (来自常量):
```typescript
{
  title: string;        // 模块名称
  coreProblem: string;  // 核心问题
  knowledgeFramework: string[];  // 知识/方法论框架
  winningPoints: string[];       // 必赢之战
  actionPlan: string[];          // 行动计划
  keyMetrics: string[];          // 衡量指标
}
```

**支持的模块及对应表格**:

1. **经营目标** - FinancialTable
   - 表格类型: 动态年份财务指标表
   - 默认列: 财务指标, 2023年(实际), 2024年(目标)
   - 默认行: 收入、边界利润、固定成本、利润、应收账款、库存
   - 特点: 支持动态添加年份、行、列，列宽可拖拽调整

2. **市场选择** - MarketSelectionTable
   - 表格列定义:
     ```
     业务类型 | 细分市场 | 经营定位 | 增长点 | 内部要求
     ```
   - 支持自定义列名和动态添加行列

3. **客户结构** - CustomerStructureTabs (三个子表)
   - 北极星客户画像:
     ```
     维度 | 描述
     - 北极星客户标准
     - 能力维度
     - 意愿维度
     ```
   - 北极星客户盘点:
     ```
     客户名称 | 去年采购额 | 钱包份额 | 增长点 | 增长策略
     ```
   - 客户组合规划:
     ```
     区域 | 区隔市场 | 标杆客户(已有) | 标杆客户(潜在) | 利润客户(已有) | 利润客户(潜在) | 培育客户 | 组合策略
     ```
   - 特点: 支持API加载保存，自动持久化

4. **价值竞争** - ValueCompetitionTable
   - 表格列:
     ```
     客户类型 | 价值维度 | 企业1 | 企业2 | 竞争策略 | 部门要求
     ```
   - 底部: 核心竞争策略文本框
   - 特点: 支持行合并(rowSpan)

5. **战略承接** - DepartmentStrategyTable
   - 表格列:
     ```
     战略目标 | 部门承接点 | 部门指标 | 差距分析 | 卡点分析 | 核心对策
     ```
   - 特点: 部门级战略承接

6. **业务流程** - BusinessProcessTable
   - 表格列:
     ```
     业务流程 | 数据统计 | 核心问题 | 关键原因 | 解决对策 | AI赋能点
     ```

7. **团队效能** - TeamEfficiencyTable
   - 表格列:
     ```
     效能维度 | 关键场景 | 核心问题 | 关键原因 | 解决对策 | AI赋能点
     ```
   - 预设5个效能维度: 知识结构、工作效率、时间管理、思维方式、激情状态

8. **复盘管理** - ReviewManagementTable
   - 表格列:
     ```
     管理维度 | 主要内容 | 核心问题 | 关键原因 | 解决对策 | AI赋能点
     ```
   - 预设3个维度: 数据分析、复盘会议、绩效辅导

#### StrategyMap.tsx (战略导航地图)
**结构**:
```
       经营目标
      /    |    \
   市场  客户  价值
   选择  结构  竞争
      \    |    /
        
       部门
       
      /    |    \
   战略  业务  团队
   承接  流程  效能
      \    |    /
       复盘管理
```

**Props**:
```typescript
interface StrategyMapProps {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onDepartmentChange?: (deptId: string, deptName: string) => void;
  treeData: DepartmentNode[];  // 部门树
}
```

### 3.2 可编辑表格共享组件

#### ResizableTitle (列头)
- 功能: 列宽拖拽调整、右键删除列
- 支持: 动态列标题编辑

#### ResizableBodyCell (单元格)
- 功能: 行高拖拽调整（仅第一列）、右键删除行
- 支持: TextArea自动高度调整

#### 通用表格操作:
```typescript
// 支持的操作
- handleResize(index) - 列宽调整
- handleRowResize(key) - 行高调整
- handleAddColumn(index?) - 添加列
- handleAddRow() - 添加行
- handleDeleteRow(key) - 删除行
- handleDeleteColumn(colKey) - 删除列
- handleCellChange(key, dataIndex, value) - 编辑单元格
- handleColumnTitleChange(colKey, newTitle) - 编辑列标题
```

### 3.3 客户结构特殊处理 (CustomerStructureTabs)

**API集成**:
- GET `/api/enterprise/customer-structure?tableType={type}&departmentId={id}`
- POST `/api/enterprise/customer-structure` - 保存表格数据

**数据持久化**:
- 500ms防抖保存
- 支持departmentId隔离数据

**表格类型**:
- customer_portrait (北极星客户画像)
- customer_inventory (北极星客户盘点)
- customer_portfolio (客户组合规划)

---

## 四、AI配置模块 (AI Configuration)

### 4.1 AISidebar.tsx (AI助手)

**Props**:
```typescript
interface AISidebarProps {
  pageTitle: string;      // 当前页面标题
  pageContent: string;    // 当前页面内容JSON
  onApplyUpdates?: (updates: TableUpdate[]) => void;
}
```

**核心数据结构**:

#### Message (聊天消息)
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

#### ChatHistory (聊天历史)
```typescript
interface ChatHistory {
  id: string;
  title: string;
  pageTitle: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
```

#### TableUpdate (表格更新)
```typescript
interface TableUpdate {
  rowIndex: number;
  column: string;
  oldValue: string;
  newValue: string;
}
```

**功能模块**:

1. **AI模型选择**:
   ```
   - Claude Opus 4.5
   - Claude Sonnet 4.5 (Thinking)
   - Claude Haiku 4.5 (Thinking)
   - Gemini 3 Pro Preview
   - Gemini 3 Flash
   - GPT-5.2
   - GPT-5.1 Codex Max
   - DeepSeek V3.2 Think
   - GLM 4.7
   ```

2. **AI配置项** (localStorage存储):
   ```typescript
   {
     apiBaseUrl: string;    // API基地址 (默认: https://router.shengsuanyun.com/api/v1)
     apiKey: string;        // API密钥
     model: string;         // 选中模型
     contextInfo: string;   // AI背景信息 (最多2000字)
   }
   ```

3. **欢迎消息** (每页面定制化):
   - 战略承接: 战略拆解与执行路径规划
   - 经营目标: 财务指标推演
   - 市场选择: 市场战略规划
   - 客户结构: 客户战略规划
   - 价值竞争: 竞争分析与策略
   - 业务流程: 流程分析与优化
   - 团队效能: 团队能力分析
   - 复盘管理: 复盘分析

4. **API交互**:
   - POST `/api/ai/chat`
   - 请求体:
     ```typescript
     {
       messages: Message[];
       context: {
         pageTitle: string;
         pageContent: string;
       };
       config: AIConfig;
     }
     ```
   - 响应:
     ```typescript
     {
       content: string;
       tableUpdates?: TableUpdate[];
     }
     ```

5. **本地存储**:
   - `ai_config`: AI配置
   - `ai_chat_history`: 聊天历史 (最多50条)
   - `token`: 认证令牌

---

## 五、组织设置模块 (Organization Settings)

### 5.1 位置: src/app/enterprise/page.tsx

**菜单导航**:
1. **总驾驶舱** - 开发中
2. **战略解码** - 主功能
3. **绩效复盘** - PerformanceReview
4. **组织设置** - OrganizationSettings
5. **AI配置** - AIConfig面板

**AI配置面板** (aiconfig菜单):

**表单字段**:
```typescript
{
  apiBaseUrl: string;   // API地址输入
  apiKey: string;       // 密钥输入(密码框)
  model: string;        // 模型选择(下拉)
  contextInfo: string;  // 企业背景信息(文本域，2000字限制)
}
```

**操作按钮**:
- 保存配置 - 验证后保存到localStorage和数据库
- 测试连接 - 调用 `{apiBaseUrl}/models` 验证

**账号管理** (account菜单):

**用户列表**:
```typescript
interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: string;  // ENTERPRISE_ADMIN | EMPLOYEE
  createdAt: string;
}
```

**操作**:
- 添加管理员 - 弹窗表单
- 删除用户 - 仅允许删除非首创建者的用户

**个人中心** (profile菜单):
```
- 用户头像
- 用户名
- 邮箱
- 用户身份
- 注册时间
- 企业账号信息
```

---

## 六、绩效复盘模块 (Performance Review)

### 6.1 PerformanceReview.tsx (核心)

**功能标签页**:

#### 1. 指标总览 (indicators)

**IndicatorData结构**:
```typescript
{
  key: string;
  indicator: string;              // 部门指标名
  currentValue: string;           // 现状值
  targetValue: string;            // 目标值
  statisticMethod: string;        // 累计|平均|最新值|同比|环比
  dataSource: string;             // 财务系统|CRM|ERP|人工填报|OA
  weight: string;                 // 权重占比(如: 20%)
}
```

**表格列**:
| 部门指标 | 现状值 | 目标值 | 统计方式 | 数据来源 | 权重占比 | 操作 |

**特点**: 
- 支持动态添加/删除指标
- 统计方式和数据来源为下拉选择

#### 2. 月度统计分析 (monthly)

**MonthlyData结构**:
```typescript
{
  key: string;
  indicator: string;
  jan: string;   // 1月-12月
  feb: string;
  // ... 到 dec
}
```

**表格列**: 指标名称 | 1月-12月 | 操作

**视觉化**: 
- LineChart趋势图（Recharts）
- 12个月数据点，每条线为一个指标
- 支持多指标多颜色显示

#### 3. 复盘分析表

**ReviewAnalysisData结构**:
```typescript
{
  key: string;
  keyIndicator: string;  // 关键指标
  gap: string;           // 找差距 (与目标的差距)
  reason: string;        // 找原因 (根本原因)
  solution: string;      // 找对策 (改进措施)
}
```

**表格列**:
| 关键指标 | 找差距 | 找原因 | 找对策 | 操作 |

**特点**: TextArea支持多行输入

#### 4. 人才盘点 (talent)

**TalentData结构**:
```typescript
{
  key: string;
  name: string;                    // 姓名
  attitude: number;                // 态度评分 (1-5)
  attitudeNote: string;            // 态度说明
  performance: number;             // 绩效评分 (1-5)
  performanceNote: string;         // 绩效说明
}
```

**评分说明**:
- **态度评分**:
  - 5: 非常积极主动，超越期望
  - 4: 积极主动，表现良好
  - 3: 态度正常，符合要求
  - 2: 态度一般，需要改进
  - 1: 态度消极，严重问题

- **绩效评分**:
  - 5: 卓越，远超目标
  - 4: 优秀，超额完成
  - 3: 良好，达成目标
  - 2: 待改进，未达目标
  - 1: 不合格，差距明显

**九宫格人才矩阵**:
```
         低          中          高
态度高  待培养      潜力股      明星员工
态度中  待观察      骨干员工    高绩效者
态度低  淘汰区      老油条      能力强但态度差
       低绩效       中绩效       高绩效
```

**特点**:
- 人员可拖入对应宫格
- 支持删除和编辑
- 实时分类汇总

#### 5. ReviewManagementTable.tsx (复盘管理矩阵)

**ReviewData结构**:
```typescript
{
  key: string;
  dimension: string;         // 管理维度
  main_content: string;      // 主要内容
  core_issue: string;        // 核心问题
  key_reason: string;        // 关键原因
  solution: string;          // 解决对策
  ai_enablement: string;     // AI赋能点
}
```

**默认维度**:
- 数据分析
- 复盘会议
- 绩效辅导

---

## 七、页面导航结构

### 7.1 主导航菜单树

```
/enterprise
├── /page.tsx (主页)
│   ├── 总驾驶舱 (dashboard)
│   ├── 战略解码 (decode)
│   │   ├── 经营目标
│   │   ├── 市场选择
│   │   ├── 客户结构
│   │   ├── 价值竞争
│   │   └── [部门]
│   │       ├── 战略承接
│   │       ├── 业务流程
│   │       ├── 团队效能
│   │       └── 复盘管理
│   ├── 绩效复盘 (review)
│   │   ├── 指标总览
│   │   ├── 月度统计
│   │   └── 人才盘点
│   ├── 组织设置 (org)
│   ├── AI配置 (aiconfig)
│   └── 系统设置
│       ├── 个人中心 (profile)
│       ├── 账号管理 (account)
│       └── 退出登录

/admin (管理后台)
├── /dashboard (总览)
├── /enterprises (企业管理)
├── /users (用户管理)
├── /statistics (统计分析)
└── /settings (系统设置)
```

---

## 八、数据流和API接口汇总

### 8.1 战略数据API

```
GET /api/enterprise/departments
  - 获取部门树
  - Response: ApiDepartment[]

POST /api/enterprise/customer-structure
  - 保存客户结构表格
  - Body: { tableType, departmentId, columns, data, rowHeights }

GET /api/enterprise/customer-structure?tableType={type}&departmentId={id}
  - 获取客户结构数据
  - Response: { exists, columns, data, rowHeights }
```

### 8.2 AI相关API

```
POST /api/ai/chat
  - AI聊天请求
  - Body: { messages, context: { pageTitle, pageContent }, config }
  - Response: { content, tableUpdates? }

GET /api/enterprises/{enterpriseId}
  - 获取企业信息

POST /api/enterprise/users
  - 创建用户

DELETE /api/enterprise/users/{userId}
  - 删除用户

GET /api/enterprise/users
  - 获取企业用户列表
```

---

## 九、状态管理概览

### 9.1 本地状态 (localStorage)

```javascript
{
  'token': string,                 // 认证令牌
  'user': JSON.stringify(User),    // 当前用户信息
  'ai_config': JSON.stringify({
    apiBaseUrl,
    apiKey,
    model,
    contextInfo
  }),
  'ai_chat_history': JSON.stringify(ChatHistory[]),
  'enterprise_active_menu': string // 上次选中菜单
}
```

### 9.2 React State关键状态

**页面级**:
- `selectedId`: 当前选中的战略模块ID
- `treeData`: 部门树
- `activeDeptName`: 当前部门名称
- `activeMenu`: 当前菜单项
- `navCollapsed`: 导航栏折叠状态
- `mapCollapsed`: 策略地图折叠状态
- `mapWidth`: 策略地图宽度

**表格级**:
- `columns`: 表格列定义
- `data`: 表格数据行
- `rowHeights`: 行高映射
- `isLoading`: 加载状态

**AI级**:
- `messages`: 聊天消息数组
- `inputValue`: 输入框值
- `loading`: AI回复加载状态
- `pendingUpdates`: 待应用的表格更新
- `chatHistory`: 聊天历史记录
- `currentChatId`: 当前聊天ID
- `selectedModel`: 选中的AI模型

---

## 十、关键技术特性

### 10.1 表格编辑特性

- **列宽调整**: react-resizable包
- **行高调整**: 仅第一列支持Y轴拖拽
- **上下文菜单**: 右键删除行/列
- **内联编辑**: TextArea自动高度
- **动态行列**: 支持运行时添加/删除

### 10.2 数据持久化

- **客户结构**: API 500ms防抖保存
- **AI配置**: localStorage + 可选数据库
- **聊天历史**: localStorage (最多50条)

### 10.3 组件设计模式

- **通用可编辑表格**: GenericTable (CustomerStructureTabs)
- **可重用单元格**: ResizableTitle, ResizableBodyCell
- **模块化菜单**: Tab页签切换

### 10.4 样式系统

- SCSS模块化样式
- Ant Design组件库
- Recharts可视化图表

---

## 十一、扩展点和改进建议

1. **数据库持久化**: CustomerStructureData需要连接API层
2. **战略执行跟踪**: 当前缺少版本控制和更新历史
3. **权限管理**: 部门级数据隔离需强化
4. **批量操作**: 表格支持批选和批量更新
5. **导出功能**: 表格、报表导出为Excel/PDF
6. **审核流程**: 战略发布前的多级审批
7. **团队协作**: 实时协作编辑支持

