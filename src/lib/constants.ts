import { BlockContent, DepartmentNode } from '@/types';

// AI Model configurations
export const AI_MODELS = [
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
  { value: 'anthropic/claude-sonnet-4.5:thinking', label: 'Claude Sonnet 4.5 (Thinking)' },
  { value: 'anthropic/claude-haiku-4.5:thinking', label: 'Claude Haiku 4.5 (Thinking)' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro Preview' },
  { value: 'google/gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'openai/gpt-5.2', label: 'GPT-5.2' },
  { value: 'openai/gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
  { value: 'deepseek/deepseek-v3.2-think', label: 'DeepSeek V3.2 Think' },
  { value: 'bigmodel/glm-4.7', label: 'GLM 4.7' },
];

// Default AI configuration
export const DEFAULT_AI_CONFIG = {
  apiBaseUrl: 'https://router.shengsuanyun.com/api/v1',
  apiKey: '',
  model: 'anthropic/claude-sonnet-4.5:thinking',
  contextInfo: ''
};

// Table configuration constants
export const TABLE_CONFIG = {
  DEBOUNCE_MS: 1500,
  DEFAULT_COLUMN_WIDTH: 200,
  DEFAULT_ROW_HEIGHT: 50,
  MIN_COLUMN_WIDTH: 100,
  MAX_COLUMN_WIDTH: 500,
  MIN_FONT_SIZE: 12,
  MAX_FONT_SIZE: 32,
  DEFAULT_FONT_SIZE: 14,
};

// UI configuration constants
export const UI_CONFIG = {
  NAV_COLLAPSED_WIDTH: 70,
  NAV_EXPANDED_WIDTH: 220,
  MAP_MIN_WIDTH: 280,
  MAP_MAX_WIDTH: 800,
  MAP_DEFAULT_WIDTH: 340,
};

export const INITIAL_CONTENT: Record<string, BlockContent> = {
  'business-goals': {
    title: '经营目标',
    coreProblem: '企业的核心经营目标是什么？',
    knowledgeFramework: ['财务指标', '增长趋势', '成本结构'],
    winningPoints: ['收入增长', '利润率提升', '现金流健康'],
    actionPlan: ['优化定价', '控制成本', '加速回款'],
    keyMetrics: ['营收', '净利润', '周转率']
  },
  'market': {
    title: '市场选择',
    coreProblem: '即使最好的产品，如果进入了错误的市场，也难以获得成功。我们需要明确：我们的主战场在哪里？哪里有最大的增长潜力？',
    knowledgeFramework: ['TAM/SAM/SOM 分析', '波特五力模型', 'PESTEL 分析'],
    winningPoints: ['高增长细分市场渗透', '区域市场扩张', '蓝海市场探索'],
    actionPlan: ['完成年度市场调研报告', '制定季度市场拓展计划', '建立市场监测机制'],
    keyMetrics: ['市场份额 (Market Share)', '市场增长率', '新市场渗透率']
  },
  'customer': {
    title: '客户结构',
    coreProblem: '谁是我们最有价值的客户？我们现有的客户结构是否健康？能否支撑未来的增长目标？',
    knowledgeFramework: ['RFM 模型', '客户生命周期价值 (CLV)', '客户画像 (Persona)'],
    winningPoints: ['高净值客户留存', '腰部客户提频', '低效客户优化'],
    actionPlan: ['实施大客户关怀计划', '优化会员权益体系', '建立客户流失预警机制'],
    keyMetrics: ['客单价 (AOV)', '客户留存率', '核心客户占比']
  },
  'value': {
    title: '价值竞争',
    coreProblem: '我们凭什么赢？在客户眼中，我们与竞争对手的本质区别是什么？我们的护城河在哪里？',
    knowledgeFramework: ['差异化战略', '价值主张设计 (VPC)', '竞争雷达图'],
    winningPoints: ['产品技术领先', '服务体验极致', '品牌影响力提升'],
    actionPlan: ['发布新一代核心技术', '升级全流程服务标准', '实施品牌焕新战役'],
    keyMetrics: ['品牌NPS', '技术专利数', '竞品胜出率']
  },
  'strategy-execution': {
    title: '战略承接',
    coreProblem: '如何确保战略目标能够被准确地拆解并执行到位，避免"上面千条线，下面一根针"的断层？',
    knowledgeFramework: ['BEM模型 (Business-Execution-Management)', '战略解码六步法', 'OGSM模型'],
    winningPoints: ['上下同欲', '执行力穿透', '闭环管理'],
    actionPlan: ['召开战略宣贯会', '签署目标责任书', '建立月度经营分析机制'],
    keyMetrics: ['战略解码覆盖率', '关键任务达成率', '执行偏差率']
  },
  'template-process': {
    title: '业务流程',
    coreProblem: '当前的业务流程是否足够敏捷、高效？是否存在断点、堵点或冗余环节阻碍了价值交付？',
    knowledgeFramework: ['流程再造 (BPR)', '精益生产 (Lean)', '价值流图分析 (VSM)'],
    winningPoints: ['流程标准化', '审批效率提升', '跨部门协同优化'],
    actionPlan: ['梳理核心业务流程SOP', '实施流程自动化改造', '开展流程效率审计'],
    keyMetrics: ['流程流转周期', '一次通过率', '流程自动化率']
  },
  'template-team': {
    title: '团队效能',
    coreProblem: '团队的组织架构、能力结构和激励机制是否匹配业务发展的需要？是否存在人效低下的问题？',
    knowledgeFramework: ['人效金字塔', '盖洛普Q12', '人才盘点九宫格'],
    winningPoints: ['组织活力激活', '关键人才保留', '人效比提升'],
    actionPlan: ['实施全员绩效考核', '开展关键岗位竞聘', '优化薪酬激励体系'],
    keyMetrics: ['人均产出 (Revenue per Employee)', '员工敬业度', '人才流失率']
  },
  'template-review': {
    title: '复盘管理',
    coreProblem: '我们需要建立怎样的学习型组织机制，才能从成功中总结经验，从失败中吸取教训，实现持续改进？',
    knowledgeFramework: ['GRAI复盘法', 'AAR (After Action Review)', 'PDCA循环'],
    winningPoints: ['组织智慧沉淀', '错误率降低', '持续改进文化'],
    actionPlan: ['建立项目结项复盘制度', '搭建知识管理库', '定期开展最佳实践分享会'],
    keyMetrics: ['复盘改进落实率', '同一错误重复发生率', '知识库贡献度']
  },
  'default': {
    title: '未配置模块',
    coreProblem: '暂无核心问题描述',
    knowledgeFramework: [],
    winningPoints: [],
    actionPlan: [],
    keyMetrics: []
  }
};

export const INITIAL_TREE_DATA: DepartmentNode[] = [
  {
    key: '1',
    title: '总经办',
    children: []
  },
  {
    key: '2',
    title: '销售部',
    children: [
      {
        key: '2-1',
        title: '华东大区',
        children: []
      },
      {
        key: '2-2',
        title: '华南大区',
        children: []
      }
    ]
  },
  {
    key: '3',
    title: '生产部',
    children: []
  },
  {
    key: '4',
    title: '研发部',
    children: []
  },
  {
    key: '5',
    title: '财务部',
    children: []
  },
];
