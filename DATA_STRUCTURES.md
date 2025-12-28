# 战略绩效项目 - 完整数据结构定义

## 一、核心类型定义

### BlockContent (战略模块内容)

```typescript
interface BlockContent {
  title: string;                    // 模块标题
  coreProblem?: string;            // 核心问题描述
  knowledgeFramework?: string[];   // 知识框架/方法论
  winningPoints?: string[];        // 必赢之战列表
  actionPlan?: string[];           // 行动计划列表
  keyMetrics?: string[];           // 衡量指标列表
}
```

**实际值示例**:
```typescript
{
  title: '市场选择',
  coreProblem: '如何选择最有潜力的市场？',
  knowledgeFramework: ['波士顿矩阵', '市场规模评估', '竞争力分析'],
  winningPoints: ['新兴市场开拓', '重点市场深化'],
  actionPlan: ['完成市场调研', '制定进入策略'],
  keyMetrics: ['市场份额增长', '客户开发数']
}
```

---

### DepartmentNode (部门树节点)

```typescript
interface DepartmentNode {
  key: string;           // 部门ID
  title: string;         // 部门名称
  children?: DepartmentNode[];  // 子部门
}
```

**树结构示例**:
```
{
  key: 'dept-001',
  title: '销售部',
  children: [
    {
      key: 'dept-001-01',
      title: '华东区',
      children: []
    },
    {
      key: 'dept-001-02',
      title: '华北区',
      children: []
    }
  ]
}
```

---

## 二、战略解码模块数据结构

### FinancialData (财务指标数据)

```typescript
interface FinancialData {
  key: string;                    // 唯一标识
  metric: string;                 // 指标名称
  [year: string]: string;         // 动态年份数据，如 '2023', '2024'
}
```

**示例**:
```typescript
{
  key: '1',
  metric: '收入 (Revenue)',
  '2023': '5,000万',
  '2024': '8,000万'
}
```

**表格列配置**:
```typescript
interface ColumnDef {
  title: string;        // 列标题
  dataIndex: string;    // 数据字段
  key: string;          // 列唯一标识
  width: number;        // 列宽 (px)
  fixed?: 'left' | 'right';
  editable?: boolean;   // 是否可编辑
}

// 默认列
const INITIAL_COLUMNS = [
  { title: '财务指标', dataIndex: 'metric', key: 'metric', fixed: 'left', width: 200 },
  { title: '2023年 (实际)', dataIndex: '2023', key: '2023', width: 150 },
  { title: '2024年 (目标)', dataIndex: '2024', key: '2024', width: 150 }
]
```

---

### MarketData (市场选择数据)

```typescript
interface MarketData {
  key: string;
  business_type?: string;         // 业务类型
  market_segment?: string;        // 细分市场
  core_positioning?: string;      // 经营定位
  growth_point?: string;          // 增长点
  internal_requirement?: string;  // 内部要求
  [customKey: string]: string;    // 支持自定义列
}
```

---

### CustomerStructure (客户结构三表)

#### 北极星客户画像 (CustomerPortrait)
```typescript
interface PortraitData {
  key: string;
  dimension: string;      // 维度 (如: '北极星客户标准', '能力维度', '意愿维度')
  description: string;    // 描述
}
```

#### 北极星客户盘点 (CustomerInventory)
```typescript
interface InventoryData {
  key: string;
  customer_name: string;         // 客户名称
  last_year_purchase: string;   // 去年采购额
  wallet_share: string;         // 钱包份额
  growth_point: string;         // 增长点
  growth_strategy: string;      // 增长策略
}
```

#### 客户组合规划 (CustomerPortfolio)
```typescript
interface PortfolioData {
  key: string;
  region: string;                 // 区域
  segment_market: string;         // 区隔市场
  benchmark_existing: string;     // 标杆客户-已有
  benchmark_potential: string;    // 标杆客户-潜在
  profit_existing: string;        // 利润客户-已有
  profit_potential: string;       // 利润客户-潜在
  nurture_customer: string;       // 培育客户
  portfolio_strategy: string;     // 组合策略
}
```

---

### ValueData (价值竞争矩阵)

```typescript
interface ValueData {
  key: string;
  customer_type?: string;   // 客户类型
  dimension: string;        // 价值维度
  enterprise1: string;      // 对标企业1
  enterprise2: string;      // 对标企业2
  strategy: string;         // 竞争策略
  department: string;       // 部门要求
  rowSpan?: number;         // 行合并数 (用于维度合并)
}
```

---

### StrategyData (部门战略承接)

```typescript
interface StrategyData {
  key: string;
  strategic_goal: string;         // 战略目标
  department_connection: string;  // 部门承接点
  department_goal: string;        // 部门指标
  gap_analysis: string;           // 差距分析
  bottleneck_analysis: string;    // 卡点分析
  core_solution: string;          // 核心对策
}
```

---

### ProcessData (业务流程分析)

```typescript
interface ProcessData {
  key: string;
  business_process: string;   // 业务流程
  data_statistics: string;    // 数据统计
  core_issue: string;         // 核心问题
  key_reason: string;         // 关键原因
  solution: string;           // 解决对策
  ai_enablement: string;      // AI赋能点
}
```

---

### TeamEfficiencyData (团队效能分析)

```typescript
interface TeamEfficiencyData {
  key: string;
  efficiency_dimension: string;  // 效能维度
  key_scenario: string;          // 关键场景
  core_problem: string;          // 核心问题
  key_reason: string;            // 关键原因
  solution: string;              // 解决对策
  ai_enablement: string;         // AI赋能点
}

// 预设5个效能维度
const INITIAL_DATA = [
  { efficiency_dimension: '知识结构', ... },
  { efficiency_dimension: '工作效率', ... },
  { efficiency_dimension: '时间管理', ... },
  { efficiency_dimension: '思维方式', ... },
  { efficiency_dimension: '激情状态', ... }
]
```

---

### ReviewData (复盘管理矩阵)

```typescript
interface ReviewData {
  key: string;
  dimension: string;         // 管理维度
  main_content: string;      // 主要内容
  core_issue: string;        // 核心问题
  key_reason: string;        // 关键原因
  solution: string;          // 解决对策
  ai_enablement: string;     // AI赋能点
}

// 预设3个维度
const INITIAL_DATA = [
  { dimension: '数据分析', ... },
  { dimension: '复盘会议', ... },
  { dimension: '绩效辅导', ... }
]
```

---

## 三、AI模块数据结构

### Message (聊天消息)

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 示例对话
const messages: Message[] = [
  { role: 'assistant', content: '您好！我可以帮您完善市场选择页面的内容。' },
  { role: 'user', content: '请帮我分析一下这个市场的机会' },
  { role: 'assistant', content: '根据您提供的数据，我发现...' }
]
```

---

### ChatHistory (聊天历史记录)

```typescript
interface ChatHistory {
  id: string;                    // 聊天ID (时间戳)
  title: string;                 // 聊天标题 (首条用户消息前30字)
  pageTitle: string;             // 所在页面标题
  messages: Message[];           // 消息列表
  createdAt: string;             // 创建时间 (ISO)
  updatedAt: string;             // 更新时间 (ISO)
}

// 示例
{
  id: '1735158642000',
  title: '请帮我分析市场选择的策略...',
  pageTitle: '市场选择',
  messages: [
    { role: 'assistant', content: '欢迎信息...' },
    { role: 'user', content: '请帮我分析市场选择的策略...' }
  ],
  createdAt: '2025-12-26T10:00:42Z',
  updatedAt: '2025-12-26T10:02:15Z'
}
```

---

### AIConfig (AI配置)

```typescript
interface AIConfig {
  apiBaseUrl: string;     // API基地址
  apiKey: string;         // API密钥
  model: string;          // 选中的模型
  contextInfo: string;    // AI背景信息
}

// 默认值
const defaultConfig: AIConfig = {
  apiBaseUrl: 'https://router.shengsuanyun.com/api/v1',
  apiKey: '',
  model: 'anthropic/claude-sonnet-4.5:thinking',
  contextInfo: ''
}
```

---

### TableUpdate (表格更新建议)

```typescript
interface TableUpdate {
  rowIndex: number;    // 行索引
  column: string;      // 列名
  oldValue: string;    // 原值
  newValue: string;    // 新值
}

// 示例 (AI返回的表格更新)
[
  { rowIndex: 0, column: 'metric', oldValue: '收入', newValue: '营业收入' },
  { rowIndex: 1, column: '2024', oldValue: '', newValue: '8,500万' }
]
```

---

## 四、绩效复盘模块数据结构

### IndicatorData (部门绩效指标)

```typescript
interface IndicatorData {
  key: string;
  indicator: string;              // 指标名称
  currentValue: string;           // 现状值
  targetValue: string;            // 目标值
  statisticMethod: string;        // 统计方式
  dataSource: string;             // 数据来源
  weight: string;                 // 权重占比
}

// 示引示例
{
  key: '1',
  indicator: '销售额',
  currentValue: '1000万',
  targetValue: '1500万',
  statisticMethod: '累计',
  dataSource: '财务系统',
  weight: '25%'
}

// 统计方式枚举
type StatisticMethod = '累计' | '平均' | '最新值' | '同比' | '环比'

// 数据来源枚举
type DataSource = '财务系统' | 'CRM系统' | 'ERP系统' | '人工填报' | 'OA系统'
```

---

### MonthlyData (月度数据)

```typescript
interface MonthlyData {
  key: string;
  indicator: string;   // 指标名称
  jan: string;         // 1月数据
  feb: string;         // 2月数据
  mar: string;         // 3月数据
  apr: string;         // 4月数据
  may: string;         // 5月数据
  jun: string;         // 6月数据
  jul: string;         // 7月数据
  aug: string;         // 8月数据
  sep: string;         // 9月数据
  oct: string;         // 10月数据
  nov: string;         // 11月数据
  dec: string;         // 12月数据
}
```

---

### ReviewAnalysisData (复盘分析)

```typescript
interface ReviewAnalysisData {
  key: string;
  keyIndicator: string;  // 关键指标
  gap: string;           // 找差距 (与目标的差距)
  reason: string;        // 找原因 (根本原因)
  solution: string;      // 找对策 (改进对策)
}

// 示例
{
  key: '1',
  keyIndicator: '销售额',
  gap: '实际1000万，目标1500万，差距500万',
  reason: '市场竞争激烈，部分大客户流失',
  solution: '加强客户服务，开发新客户，提高产品竞争力'
}
```

---

### TalentData (人才评分)

```typescript
interface TalentData {
  key: string;
  name: string;                    // 姓名
  attitude: number;                // 态度评分 (1-5)
  attitudeNote: string;            // 态度说明
  performance: number;             // 绩效评分 (1-5)
  performanceNote: string;         // 绩效说明
}

// 评分标准

// 态度评分:
// 5: 非常积极主动，超越期望
// 4: 积极主动，表现良好
// 3: 态度正常，符合要求
// 2: 态度一般，需要改进
// 1: 态度消极，严重问题

// 绩效评分:
// 5: 卓越，远超目标
// 4: 优秀，超额完成
// 3: 良好，达成目标
// 2: 待改进，未达目标
// 1: 不合格，差距明显
```

---

### NineGridData (人才九宫格)

```typescript
interface NineGridData {
  'high-low': string[];      // 态度高，绩效低 - 待培养
  'high-mid': string[];      // 态度高，绩效中 - 潜力股
  'high-high': string[];     // 态度高，绩效高 - 明星员工
  'mid-low': string[];       // 态度中，绩效低 - 待观察
  'mid-mid': string[];       // 态度中，绩效中 - 骨干员工
  'mid-high': string[];      // 态度中，绩效高 - 高绩效者
  'low-low': string[];       // 态度低，绩效低 - 淘汰区
  'low-mid': string[];       // 态度低，绩效中 - 老油条
  'low-high': string[];      // 态度低，绩效高 - 能力强但态度差
}

// 初始化示例
const INITIAL_NINE_GRID: NineGridData = {
  'high-low': ['张三'],
  'high-mid': ['李四'],
  'high-high': ['王五', '赵六'],
  'mid-low': [],
  'mid-mid': [],
  'mid-high': [],
  'low-low': [],
  'low-mid': [],
  'low-high': []
}
```

---

## 五、组织设置模块数据结构

### User (用户信息)

```typescript
interface User {
  id: string;              // 用户ID
  email: string;           // 邮箱 (唯一)
  password: string;        // 密码 (哈希)
  name: string;            // 用户名
  role: UserRole;          // 用户角色
  avatar?: string;         // 头像URL
  position?: string;       // 职位
  enterpriseId?: string;   // 所属企业
  departmentId?: string;   // 所属部门
  createdAt: Date;
  updatedAt: Date;
}

// 角色枚举
type UserRole = 'PLATFORM_ADMIN' | 'ENTERPRISE_ADMIN' | 'MANAGER' | 'EMPLOYEE'
```

---

### EnterpriseUser (企业用户列表项)

```typescript
interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: string;           // ENTERPRISE_ADMIN | EMPLOYEE
  createdAt: string;      // ISO格式
}
```

---

### Enterprise (企业信息)

```typescript
interface Enterprise {
  id: string;
  name: string;
  code: string;           // 企业代码 (唯一)
  logo?: string;          // Logo URL
  status: EnterpriseStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 状态枚举
type EnterpriseStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
```

---

### Department (部门信息)

```typescript
interface Department {
  id: string;
  name: string;
  leader?: string;         // 部门负责人
  parentId?: string;       // 上级部门ID (支持多级)
  enterpriseId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API返回格式
interface ApiDepartment {
  id: string;
  name: string;
  parentId: string | null;
  leader: string | null;
  memberCount: number;    // 成员数
}
```

---

## 六、数据库持久化结构

### CustomerStructureData (客户结构持久化)

```typescript
interface CustomerStructureData {
  id: string;              // 记录ID
  enterpriseId: string;    // 所属企业
  departmentId?: string;   // 所属部门 (可选)
  tableType: string;       // 表格类型
  columns: string;         // JSON字符串化的列定义
  data: string;           // JSON字符串化的表格数据
  rowHeights?: string;    // JSON字符串化的行高映射
  createdAt: Date;
  updatedAt: Date;
}

// 唯一约束: [enterpriseId, departmentId, tableType]

// 实际存储示例
{
  id: 'cuid-xxx',
  enterpriseId: 'ent-001',
  departmentId: 'dept-001',
  tableType: 'customer_portrait',
  columns: '[{"title":"维度","dataIndex":"dimension",...}]',
  data: '[{"key":"row-1","dimension":"北极星客户标准",...}]',
  rowHeights: '{"row-1": 50, "row-2": 60}',
  createdAt: '2025-12-26T10:00:00Z',
  updatedAt: '2025-12-26T10:05:00Z'
}
```

---

## 七、API请求/响应格式

### POST /api/ai/chat

**请求体**:
```typescript
{
  messages: Message[];                    // 聊天消息历史
  context: {
    pageTitle: string;                   // 当前页面标题
    pageContent: string;                 // 当前页面内容JSON
  };
  config: AIConfig;                      // AI配置
}
```

**响应体**:
```typescript
{
  content: string;                       // AI回复
  tableUpdates?: TableUpdate[];          // 可选的表格更新建议
  error?: string;                        // 错误信息
}
```

---

### POST /api/enterprise/customer-structure

**请求体**:
```typescript
{
  tableType: string;                     // 表格类型
  departmentId?: string;                // 部门ID (可选)
  columns: ColumnDef[];                 // 列定义
  data: TableData[];                    // 行数据
  rowHeights?: Record<string, number>;  // 行高映射
}
```

**响应体**:
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

---

### GET /api/enterprise/customer-structure?tableType={type}&departmentId={id}

**响应体**:
```typescript
{
  exists: boolean;                       // 是否存在该数据
  columns?: ColumnDef[];                // 列定义
  data?: TableData[];                   // 行数据
  rowHeights?: Record<string, number>;  // 行高映射
}
```

---

## 八、LocalStorage键值映射

| 键 | 数据类型 | 说明 |
|----|---------|------|
| `token` | string | JWT认证令牌 |
| `user` | JSON(User) | 当前用户对象 |
| `ai_config` | JSON(AIConfig) | AI配置 |
| `ai_chat_history` | JSON(ChatHistory[]) | 聊天历史 (最多50条) |
| `enterprise_active_menu` | string | 当前活跃菜单 |

---

## 九、枚举和常量值

### AI模型列表
```typescript
[
  'anthropic/claude-opus-4.5',
  'anthropic/claude-sonnet-4.5:thinking',
  'anthropic/claude-haiku-4.5:thinking',
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash',
  'openai/gpt-5.2',
  'openai/gpt-5.1-codex-max',
  'deepseek/deepseek-v3.2-think',
  'bigmodel/glm-4.7'
]
```

### 菜单项
```typescript
type ActiveMenu = 'dashboard' | 'decode' | 'review' | 'org' | 'aiconfig' | 'profile' | 'account'
```

### 模块ID
```typescript
type ModuleId = 
  | 'business-goals'      // 经营目标
  | 'market'             // 市场选择
  | 'customer'           // 客户结构
  | 'value'              // 价值竞争
  | `${deptId}-execution` // 战略承接
  | `${deptId}-process`   // 业务流程
  | `${deptId}-team`      // 团队效能
  | `${deptId}-review`    // 复盘管理
```

---

## 十、类型兼容性说明

```typescript
// 通用表格行接口
interface TableRow {
  key: string;
  [field: string]: string | number | undefined;
}

// 所有表格数据都继承此结构:
// - FinancialData
// - MarketData
// - PortraitData
// - InventoryData
// - ValueData
// 等等

// 列定义通用接口
interface ColumnConfig {
  title: string;
  dataIndex: string;
  key: string;
  width: number;
  fixed?: 'left' | 'right';
  editable?: boolean;
  render?: (text: any, record: any) => React.ReactNode;
}
```

