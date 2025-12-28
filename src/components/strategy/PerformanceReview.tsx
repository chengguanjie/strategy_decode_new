import React, { useState } from 'react';
import { Tabs, Card, Table, Input, InputNumber, Select, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './PerformanceReview.scss';

interface IndicatorData {
  key: string;
  indicator: string;
  currentValue: string;
  targetValue: string;
  statisticMethod: string;
  dataSource: string;
  weight: string;
}

interface MonthlyData {
  key: string;
  indicator: string;
  jan: string;
  feb: string;
  mar: string;
  apr: string;
  may: string;
  jun: string;
  jul: string;
  aug: string;
  sep: string;
  oct: string;
  nov: string;
  dec: string;
}

interface ReviewAnalysisData {
  key: string;
  keyIndicator: string;
  gap: string;
  reason: string;
  solution: string;
}

interface TalentData {
  key: string;
  name: string;
  attitude: number;
  performance: number;
  attitudeNote: string;
  performanceNote: string;
}

interface NineGridData {
  [key: string]: string[];
}

const STATISTIC_METHODS = ['累计', '平均', '最新值', '同比', '环比'];
const DATA_SOURCES = ['财务系统', 'CRM系统', 'ERP系统', '人工填报', 'OA系统'];

const INITIAL_INDICATORS: IndicatorData[] = [
  { key: '1', indicator: '', currentValue: '', targetValue: '', statisticMethod: '累计', dataSource: '人工填报', weight: '' },
  { key: '2', indicator: '', currentValue: '', targetValue: '', statisticMethod: '累计', dataSource: '人工填报', weight: '' },
  { key: '3', indicator: '', currentValue: '', targetValue: '', statisticMethod: '累计', dataSource: '人工填报', weight: '' },
];

const INITIAL_MONTHLY_DATA: MonthlyData[] = [
  { key: '1', indicator: '指标1', jan: '', feb: '', mar: '', apr: '', may: '', jun: '', jul: '', aug: '', sep: '', oct: '', nov: '', dec: '' },
  { key: '2', indicator: '指标2', jan: '', feb: '', mar: '', apr: '', may: '', jun: '', jul: '', aug: '', sep: '', oct: '', nov: '', dec: '' },
];

const INITIAL_REVIEW_DATA: ReviewAnalysisData[] = [
  { key: '1', keyIndicator: '', gap: '', reason: '', solution: '' },
  { key: '2', keyIndicator: '', gap: '', reason: '', solution: '' },
];

const INITIAL_TALENT_DATA: TalentData[] = [
  { key: '1', name: '', attitude: 3, performance: 3, attitudeNote: '', performanceNote: '' },
  { key: '2', name: '', attitude: 3, performance: 3, attitudeNote: '', performanceNote: '' },
  { key: '3', name: '', attitude: 3, performance: 3, attitudeNote: '', performanceNote: '' },
];

const INITIAL_NINE_GRID: NineGridData = {
  'high-low': [],
  'high-mid': [],
  'high-high': [],
  'mid-low': [],
  'mid-mid': [],
  'mid-high': [],
  'low-low': [],
  'low-mid': [],
  'low-high': [],
};

const PerformanceReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('indicators');
  const [indicators, setIndicators] = useState<IndicatorData[]>(INITIAL_INDICATORS);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(INITIAL_MONTHLY_DATA);
  const [reviewData, setReviewData] = useState<ReviewAnalysisData[]>(INITIAL_REVIEW_DATA);
  const [talentData, setTalentData] = useState<TalentData[]>(INITIAL_TALENT_DATA);
  const [nineGrid, setNineGrid] = useState<NineGridData>(INITIAL_NINE_GRID);
  const [newName, setNewName] = useState<{ [key: string]: string }>({});

  const handleIndicatorChange = (key: string, field: keyof IndicatorData, value: string) => {
    setIndicators(prev => prev.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const addIndicator = () => {
    const newKey = `${Date.now()}`;
    setIndicators([...indicators, {
      key: newKey,
      indicator: '',
      currentValue: '',
      targetValue: '',
      statisticMethod: '累计',
      dataSource: '人工填报',
      weight: ''
    }]);
  };

  const deleteIndicator = (key: string) => {
    if (indicators.length <= 1) return;
    setIndicators(indicators.filter(item => item.key !== key));
  };

  const handleMonthlyChange = (key: string, field: string, value: string) => {
    setMonthlyData(prev => prev.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const addMonthlyRow = () => {
    const newKey = `${Date.now()}`;
    setMonthlyData([...monthlyData, {
      key: newKey,
      indicator: `指标${monthlyData.length + 1}`,
      jan: '', feb: '', mar: '', apr: '', may: '', jun: '',
      jul: '', aug: '', sep: '', oct: '', nov: '', dec: ''
    }]);
  };

  const deleteMonthlyRow = (key: string) => {
    if (monthlyData.length <= 1) return;
    setMonthlyData(monthlyData.filter(item => item.key !== key));
  };

  const handleReviewChange = (key: string, field: keyof ReviewAnalysisData, value: string) => {
    setReviewData(prev => prev.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const addReviewRow = () => {
    const newKey = `${Date.now()}`;
    setReviewData([...reviewData, { key: newKey, keyIndicator: '', gap: '', reason: '', solution: '' }]);
  };

  const deleteReviewRow = (key: string) => {
    if (reviewData.length <= 1) return;
    setReviewData(reviewData.filter(item => item.key !== key));
  };

  const handleTalentChange = (key: string, field: keyof TalentData, value: string | number) => {
    setTalentData(prev => prev.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const addTalentRow = () => {
    const newKey = `${Date.now()}`;
    setTalentData([...talentData, { key: newKey, name: '', attitude: 3, performance: 3, attitudeNote: '', performanceNote: '' }]);
  };

  const deleteTalentRow = (key: string) => {
    if (talentData.length <= 1) return;
    setTalentData(talentData.filter(item => item.key !== key));
  };

  const addToNineGrid = (gridKey: string) => {
    const name = newName[gridKey]?.trim();
    if (!name) return;
    setNineGrid(prev => ({
      ...prev,
      [gridKey]: [...(prev[gridKey] || []), name]
    }));
    setNewName(prev => ({ ...prev, [gridKey]: '' }));
  };

  const removeFromNineGrid = (gridKey: string, index: number) => {
    setNineGrid(prev => ({
      ...prev,
      [gridKey]: prev[gridKey].filter((_, i) => i !== index)
    }));
  };

  const getChartData = () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    return monthNames.map((name, index) => {
      const dataPoint: { month: string;[key: string]: string | number } = { month: name };
      monthlyData.forEach(row => {
        const value = row[months[index] as keyof MonthlyData];
        dataPoint[row.indicator] = value ? parseFloat(value) : 0;
      });
      return dataPoint;
    });
  };

  const COLORS = ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E86452', '#6DC8EC', '#945FB9', '#FF9845'];

  const indicatorColumns = [
    {
      title: '部门指标',
      dataIndex: 'indicator',
      key: 'indicator',
      width: 180,
      render: (text: string, record: IndicatorData) => (
        <Input
          value={text}
          onChange={e => handleIndicatorChange(record.key, 'indicator', e.target.value)}
          placeholder="输入指标名称"
          bordered={false}
        />
      ),
    },
    {
      title: '现状值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      width: 120,
      render: (text: string, record: IndicatorData) => (
        <Input
          value={text}
          onChange={e => handleIndicatorChange(record.key, 'currentValue', e.target.value)}
          placeholder="输入现状值"
          bordered={false}
        />
      ),
    },
    {
      title: '目标值',
      dataIndex: 'targetValue',
      key: 'targetValue',
      width: 120,
      render: (text: string, record: IndicatorData) => (
        <Input
          value={text}
          onChange={e => handleIndicatorChange(record.key, 'targetValue', e.target.value)}
          placeholder="输入目标值"
          bordered={false}
        />
      ),
    },
    {
      title: '统计方式',
      dataIndex: 'statisticMethod',
      key: 'statisticMethod',
      width: 120,
      render: (text: string, record: IndicatorData) => (
        <Select
          value={text}
          onChange={value => handleIndicatorChange(record.key, 'statisticMethod', value)}
          options={STATISTIC_METHODS.map(m => ({ label: m, value: m }))}
          bordered={false}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '数据来源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 120,
      render: (text: string, record: IndicatorData) => (
        <Select
          value={text}
          onChange={value => handleIndicatorChange(record.key, 'dataSource', value)}
          options={DATA_SOURCES.map(s => ({ label: s, value: s }))}
          bordered={false}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '权重占比',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (text: string, record: IndicatorData) => (
        <Input
          value={text}
          onChange={e => handleIndicatorChange(record.key, 'weight', e.target.value)}
          placeholder="如: 20%"
          bordered={false}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: unknown, record: IndicatorData) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteIndicator(record.key)}
        />
      ),
    },
  ];

  const monthColumns = [
    {
      title: '指标名称', dataIndex: 'indicator', key: 'indicator', width: 120, fixed: 'left' as const,
      render: (text: string, record: MonthlyData) => (
        <Input value={text} onChange={e => handleMonthlyChange(record.key, 'indicator', e.target.value)} bordered={false} />
      ),
    },
    ...['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((month, idx) => ({
      title: `${idx + 1}月`,
      dataIndex: month,
      key: month,
      width: 80,
      render: (text: string, record: MonthlyData) => (
        <Input
          value={text}
          onChange={e => handleMonthlyChange(record.key, month, e.target.value)}
          bordered={false}
          style={{ textAlign: 'center' }}
        />
      ),
    })),
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: unknown, record: MonthlyData) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteMonthlyRow(record.key)} />
      ),
    },
  ];

  const reviewColumns = [
    {
      title: '关键指标',
      dataIndex: 'keyIndicator',
      key: 'keyIndicator',
      width: 150,
      render: (text: string, record: ReviewAnalysisData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleReviewChange(record.key, 'keyIndicator', e.target.value)}
          placeholder="输入关键指标"
          bordered={false}
          autoSize={{ minRows: 2 }}
        />
      ),
    },
    {
      title: '找差距',
      dataIndex: 'gap',
      key: 'gap',
      width: 200,
      render: (text: string, record: ReviewAnalysisData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleReviewChange(record.key, 'gap', e.target.value)}
          placeholder="与目标的差距是什么？"
          bordered={false}
          autoSize={{ minRows: 2 }}
        />
      ),
    },
    {
      title: '找原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      render: (text: string, record: ReviewAnalysisData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleReviewChange(record.key, 'reason', e.target.value)}
          placeholder="造成差距的根本原因？"
          bordered={false}
          autoSize={{ minRows: 2 }}
        />
      ),
    },
    {
      title: '找对策',
      dataIndex: 'solution',
      key: 'solution',
      width: 200,
      render: (text: string, record: ReviewAnalysisData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleReviewChange(record.key, 'solution', e.target.value)}
          placeholder="改进的对策和行动计划？"
          bordered={false}
          autoSize={{ minRows: 2 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: unknown, record: ReviewAnalysisData) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteReviewRow(record.key)} />
      ),
    },
  ];

  const talentColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string, record: TalentData) => (
        <Input
          value={text}
          onChange={e => handleTalentChange(record.key, 'name', e.target.value)}
          placeholder="输入姓名"
          bordered={false}
        />
      ),
    },
    {
      title: '态度评分 (1-5)',
      dataIndex: 'attitude',
      key: 'attitude',
      width: 130,
      render: (value: number, record: TalentData) => (
        <InputNumber
          min={1}
          max={5}
          value={value}
          onChange={v => handleTalentChange(record.key, 'attitude', v || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '态度说明',
      dataIndex: 'attitudeNote',
      key: 'attitudeNote',
      width: 200,
      render: (text: string, record: TalentData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleTalentChange(record.key, 'attitudeNote', e.target.value)}
          placeholder="态度表现说明"
          bordered={false}
          autoSize={{ minRows: 1 }}
        />
      ),
    },
    {
      title: '绩效评分 (1-5)',
      dataIndex: 'performance',
      key: 'performance',
      width: 130,
      render: (value: number, record: TalentData) => (
        <InputNumber
          min={1}
          max={5}
          value={value}
          onChange={v => handleTalentChange(record.key, 'performance', v || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '绩效说明',
      dataIndex: 'performanceNote',
      key: 'performanceNote',
      width: 200,
      render: (text: string, record: TalentData) => (
        <Input.TextArea
          value={text}
          onChange={e => handleTalentChange(record.key, 'performanceNote', e.target.value)}
          placeholder="绩效表现说明"
          bordered={false}
          autoSize={{ minRows: 1 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: unknown, record: TalentData) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTalentRow(record.key)} />
      ),
    },
  ];

  const renderNineGridCell = (gridKey: string, label: string, bgColor: string) => (
    <div className="nine-grid-cell" style={{ backgroundColor: bgColor }}>
      <div className="cell-label">{label}</div>
      <div className="cell-names">
        {nineGrid[gridKey]?.map((name, idx) => (
          <span key={idx} className="name-tag">
            {name}
            <DeleteOutlined className="delete-icon" onClick={() => removeFromNineGrid(gridKey, idx)} />
          </span>
        ))}
      </div>
      <div className="add-name-row">
        <Input
          size="small"
          placeholder="输入姓名"
          value={newName[gridKey] || ''}
          onChange={e => setNewName(prev => ({ ...prev, [gridKey]: e.target.value }))}
          onPressEnter={() => addToNineGrid(gridKey)}
          style={{ width: 100 }}
        />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => addToNineGrid(gridKey)} />
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'indicators',
      label: '指标总览',
      children: (
        <div className="tab-content">
          <Card
            title="部门绩效指标总览"
            bordered={false}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={addIndicator}>添加指标</Button>}
          >
            <Table
              dataSource={indicators}
              columns={indicatorColumns}
              pagination={false}
              bordered
              scroll={{ x: 'max-content' }}
            />
            <div className="table-notes" style={{ marginTop: 8 }}>
              * 部门指标继承自战略解码中的战略承接表；可自行添加、编辑指标信息
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'monthly',
      label: '月度统计分析',
      children: (
        <div className="tab-content">
          <Card
            title="月度数据录入"
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={addMonthlyRow}>添加指标</Button>}
          >
            <Table
              dataSource={monthlyData}
              columns={monthColumns}
              pagination={false}
              bordered
              scroll={{ x: 1200 }}
            />
          </Card>

          <Card title="趋势图表" bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {monthlyData.map((row, index) => (
                    <Line
                      key={row.key}
                      type="monotone"
                      dataKey={row.indicator}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="复盘分析表"
            bordered={false}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={addReviewRow}>添加行</Button>}
          >
            <Table
              dataSource={reviewData}
              columns={reviewColumns}
              pagination={false}
              bordered
            />
            <div className="table-notes" style={{ marginTop: 8 }}>
              * 复盘分析：针对关键指标，分析差距、找到原因、制定对策
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'talent',
      label: '人才盘点',
      children: (
        <div className="tab-content">
          <Card
            title="人员评分表"
            bordered={false}
            style={{ marginBottom: 24 }}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={addTalentRow}>添加人员</Button>}
          >
            <Table
              dataSource={talentData}
              columns={talentColumns}
              pagination={false}
              bordered
            />
            <div className="talent-score-legend" style={{ marginTop: 16, padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>评分说明：</div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>态度评分</div>
                  <div>5分: 非常积极主动，超越期望</div>
                  <div>4分: 积极主动，表现良好</div>
                  <div>3分: 态度正常，符合要求</div>
                  <div>2分: 态度一般，需要改进</div>
                  <div>1分: 态度消极，严重问题</div>
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>绩效评分</div>
                  <div>5分: 卓越，远超目标</div>
                  <div>4分: 优秀，超额完成</div>
                  <div>3分: 良好，达成目标</div>
                  <div>2分: 待改进，未达目标</div>
                  <div>1分: 不合格，差距明显</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="人才九宫格" bordered={false}>
            <div className="nine-grid-container">
              <div className="grid-y-label">
                <span>态度</span>
              </div>
              <div className="nine-grid">
                <div className="grid-row">
                  <div className="y-label">高</div>
                  {renderNineGridCell('high-low', '待培养', '#fff7e6')}
                  {renderNineGridCell('high-mid', '潜力股', '#e6f7ff')}
                  {renderNineGridCell('high-high', '明星员工', '#f6ffed')}
                </div>
                <div className="grid-row">
                  <div className="y-label">中</div>
                  {renderNineGridCell('mid-low', '待观察', '#fff1f0')}
                  {renderNineGridCell('mid-mid', '骨干员工', '#f0f5ff')}
                  {renderNineGridCell('mid-high', '高绩效者', '#e6fffb')}
                </div>
                <div className="grid-row">
                  <div className="y-label">低</div>
                  {renderNineGridCell('low-low', '淘汰区', '#fafafa')}
                  {renderNineGridCell('low-mid', '老油条', '#fffbe6')}
                  {renderNineGridCell('low-high', '能力强但态度差', '#fff0f6')}
                </div>
                <div className="grid-row x-labels">
                  <div className="y-label"></div>
                  <div className="x-label">低</div>
                  <div className="x-label">中</div>
                  <div className="x-label">高</div>
                </div>
              </div>
              <div className="grid-x-label">
                <span>绩效</span>
              </div>
            </div>
            <div className="table-notes" style={{ marginTop: 16 }}>
              * 在对应的九宫格中输入姓名并按回车或点击+号添加人员
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="performance-review-container">
      <div className="page-header">
        <h2>绩效复盘</h2>
        <p>指标跟踪、月度分析与人才盘点</p>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="review-tabs"
        destroyInactiveTabPane
      />
    </div>
  );
};

export default PerformanceReview;
