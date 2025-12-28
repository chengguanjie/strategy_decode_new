'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Progress,
  Modal,
  Form,
  Select,
  message,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import './Dashboard.scss';

interface MetricCard {
  id: string;
  name: string;
  targetValue: string;
  currentValue: string;
  unit: string;
  progress: number;
  status: 'success' | 'warning' | 'danger';
  sortOrder: number;
}

interface DepartmentTrend {
  departmentId: string;
  departmentName: string;
  metrics: {
    name: string;
    data: number[];
  }[];
}

interface DashboardProps {
  enterpriseId?: string;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const Dashboard: React.FC<DashboardProps> = ({ enterpriseId }) => {
  const [cards, setCards] = useState<MetricCard[]>([]);
  const [departmentTrends, setDepartmentTrends] = useState<DepartmentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MetricCard | null>(null);
  const [form] = Form.useForm();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/enterprise/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        // API 返回格式: { success: true, data: { cards, departmentTrends } }
        const dashboardData = result.data || result;
        setCards(dashboardData.cards || []);
        setDepartmentTrends(dashboardData.departmentTrends || []);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddCard = () => {
    setEditingCard(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditCard = (card: MetricCard) => {
    setEditingCard(card);
    form.setFieldsValue({
      name: card.name,
      targetValue: card.targetValue,
      currentValue: card.currentValue,
      unit: card.unit
    });
    setIsModalOpen(true);
  };

  const handleDeleteCard = (card: MetricCard) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除指标 "${card.name}" 吗？`,
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/enterprise/dashboard/cards/${card.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            message.success('删除成功');
            setCards(cards.filter(c => c.id !== card.id));
          } else {
            message.error('删除失败');
          }
        } catch (e) {
          message.error('网络错误');
        }
      }
    });
  };

  const handleSaveCard = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      const targetNum = parseFloat(values.targetValue) || 0;
      const currentNum = parseFloat(values.currentValue) || 0;
      const progress = targetNum > 0 ? Math.min(100, Math.round((currentNum / targetNum) * 100)) : 0;

      let status: 'success' | 'warning' | 'danger' = 'success';
      if (progress < 50) {
        status = 'danger';
      } else if (progress < 80) {
        status = 'warning';
      }

      const cardData = {
        ...values,
        progress,
        status
      };

      if (editingCard) {
        const res = await fetch(`/api/enterprise/dashboard/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cardData)
        });

        if (res.ok) {
          const updated = await res.json();
          setCards(cards.map(c => c.id === editingCard.id ? updated : c));
          message.success('更新成功');
        } else {
          message.error('更新失败');
        }
      } else {
        const res = await fetch('/api/enterprise/dashboard/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...cardData,
            sortOrder: cards.length
          })
        });

        if (res.ok) {
          const newCard = await res.json();
          setCards([...cards, newCard]);
          message.success('添加成功');
        } else {
          message.error('添加失败');
        }
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      case 'danger': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '达成';
      case 'warning': return '进行中';
      case 'danger': return '落后';
      default: return '未知';
    }
  };

  const renderTrendChart = (trend: DepartmentTrend) => {
    if (!trend.metrics || trend.metrics.length === 0) {
      return <Empty description="暂无指标数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];

    return (
      <div className="trend-chart">
        <div className="chart-legend">
          {trend.metrics.map((metric, idx) => (
            <div key={idx} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: colors[idx % colors.length] }}></span>
              <span className="legend-text">{metric.name}</span>
            </div>
          ))}
        </div>
        <div className="chart-container">
          <svg viewBox="0 0 800 200" className="line-chart">
            {trend.metrics.map((metric, metricIdx) => {
              const data = metric.data || [];
              const maxVal = Math.max(...data.filter(v => v > 0), 100);
              const points = data.map((val, idx) => {
                const x = 50 + (idx * (700 / 11));
                const y = 180 - ((val / maxVal) * 160);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={metricIdx}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={colors[metricIdx % colors.length]}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {data.map((val, idx) => {
                    const x = 50 + (idx * (700 / 11));
                    const y = 180 - ((val / maxVal) * 160);
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={colors[metricIdx % colors.length]}
                      />
                    );
                  })}
                </g>
              );
            })}
            {MONTHS.map((month, idx) => (
              <text
                key={idx}
                x={50 + (idx * (700 / 11))}
                y="198"
                textAnchor="middle"
                className="x-label"
              >
                {month}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <DashboardOutlined className="header-icon" />
          <h1>总驾驶舱</h1>
        </div>
      </div>

      <div className="metrics-section">
        <div className="section-header">
          <h2>公司经营目标</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
            添加指标
          </Button>
        </div>

        <div className="metrics-grid">
          {cards.map(card => (
            <Card key={card.id} className={`metric-card status-${card.status}`}>
              <div className="card-header">
                <h3>{card.name}</h3>
                <div className="card-actions">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditCard(card)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteCard(card)}
                  />
                </div>
              </div>
              <div className="card-body">
                <div className="value-row">
                  <div className="current-value">
                    <span className="value">{card.currentValue}</span>
                    <span className="unit">{card.unit}</span>
                  </div>
                  <div className="target-value">
                    <span className="label">目标：</span>
                    <span className="value">{card.targetValue}</span>
                    <span className="unit">{card.unit}</span>
                  </div>
                </div>
                <div className="progress-row">
                  <Progress
                    percent={card.progress}
                    strokeColor={getStatusColor(card.status)}
                    size="small"
                  />
                  <span
                    className="status-tag"
                    style={{ backgroundColor: getStatusColor(card.status) }}
                  >
                    {getStatusText(card.status)}
                  </span>
                </div>
              </div>
            </Card>
          ))}

          <Card className="metric-card add-card" onClick={handleAddCard}>
            <div className="add-card-content">
              <PlusOutlined className="add-icon" />
              <span>添加经营指标</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="trends-section">
        <div className="section-header">
          <h2>各部门核心指标月度趋势</h2>
        </div>

        {departmentTrends.length > 0 ? (
          <div className="trends-grid">
            {departmentTrends.map(trend => (
              <Card key={trend.departmentId} className="trend-card">
                <div className="trend-header">
                  <h3>{trend.departmentName}</h3>
                </div>
                {renderTrendChart(trend)}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="empty-trends">
            <Empty
              description="暂无部门趋势数据，请先在组织设置中添加部门并配置指标"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </div>

      <Modal
        title={editingCard ? '编辑经营指标' : '添加经营指标'}
        open={isModalOpen}
        onOk={handleSaveCard}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="指标名称"
            rules={[{ required: true, message: '请输入指标名称' }]}
          >
            <Input placeholder="例如：营业收入、净利润、市场份额" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="目标值"
            rules={[{ required: true, message: '请输入目标值' }]}
          >
            <Input placeholder="例如：1000" />
          </Form.Item>
          <Form.Item
            name="currentValue"
            label="当前值"
            rules={[{ required: true, message: '请输入当前值' }]}
          >
            <Input placeholder="例如：750" />
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Select placeholder="请选择单位">
              <Select.Option value="万元">万元</Select.Option>
              <Select.Option value="亿元">亿元</Select.Option>
              <Select.Option value="%">%</Select.Option>
              <Select.Option value="个">个</Select.Option>
              <Select.Option value="人">人</Select.Option>
              <Select.Option value="件">件</Select.Option>
              <Select.Option value="次">次</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
