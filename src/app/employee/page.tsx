'use client';

import { Layout, Menu, Card, List, Avatar, Tag, Progress, Button, Space, Empty } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import Link from 'next/link';
import './page.scss';

const { Sider, Content, Header } = Layout;

const mockTasks = [
  { id: '1', title: '完成Q1销售目标分解', status: 'in_progress', deadline: '2024-03-15', progress: 60 },
  { id: '2', title: '提交月度工作总结', status: 'pending', deadline: '2024-03-20', progress: 0 },
  { id: '3', title: '参与产品需求评审', status: 'completed', deadline: '2024-03-10', progress: 100 },
  { id: '4', title: '客户回访计划执行', status: 'in_progress', deadline: '2024-03-25', progress: 40 },
];

const mockNotifications = [
  { id: '1', title: '您有新的任务分配', time: '10分钟前' },
  { id: '2', title: '绩效评估已开放', time: '1小时前' },
  { id: '3', title: '团队会议提醒', time: '今天 14:00' },
];

export default function EmployeePage() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'in_progress':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>进行中</Tag>;
      default:
        return <Tag>待开始</Tag>;
    }
  };

  return (
    <Layout className="employee-layout">
      <Sider theme="light" width={220}>
        <div className="employee-logo">
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div className="user-info">
            <span className="name">张三</span>
            <span className="role">销售专员</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={({ key }) => setSelectedMenu(key)}
          items={[
            { key: 'dashboard', icon: <HomeOutlined />, label: '工作台' },
            { key: 'tasks', icon: <FileTextOutlined />, label: '我的任务' },
            { key: 'performance', icon: <CheckCircleOutlined />, label: '绩效目标' },
            { key: 'notifications', icon: <BellOutlined />, label: '消息通知' },
            { key: 'settings', icon: <SettingOutlined />, label: '个人设置' },
          ]}
        />
        <div className="nav-bottom">
          <Link href="/">
            <Button type="text" block>
              返回首页
            </Button>
          </Link>
        </div>
      </Sider>
      <Layout>
        <Header className="employee-header">
          <h2>员工工作台</h2>
          <Space>
            <BellOutlined style={{ fontSize: 18 }} />
            <span>张三</span>
          </Space>
        </Header>
        <Content className="employee-content">
          {selectedMenu === 'dashboard' && (
            <div className="dashboard-grid">
              <Card title="我的任务" className="tasks-card" extra={<Button type="link">查看全部</Button>}>
                <List
                  dataSource={mockTasks.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={`截止日期: ${item.deadline}`}
                      />
                      <div className="task-status">
                        {getStatusTag(item.status)}
                        <Progress percent={item.progress} size="small" style={{ width: 80 }} />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
              <Card title="消息通知" className="notifications-card">
                <List
                  dataSource={mockNotifications}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<BellOutlined />}
                        title={item.title}
                        description={item.time}
                      />
                    </List.Item>
                  )}
                />
              </Card>
              <Card title="绩效概览" className="performance-card">
                <div className="performance-stats">
                  <div className="stat-item">
                    <span className="label">任务完成率</span>
                    <Progress type="circle" percent={75} size={80} />
                  </div>
                  <div className="stat-item">
                    <span className="label">目标达成率</span>
                    <Progress type="circle" percent={60} size={80} strokeColor="#faad14" />
                  </div>
                </div>
              </Card>
            </div>
          )}
          {selectedMenu === 'tasks' && (
            <Card title="我的任务">
              <List
                dataSource={mockTasks}
                renderItem={(item) => (
                  <List.Item actions={[<Button type="link" key="view">查看详情</Button>]}>
                    <List.Item.Meta
                      title={item.title}
                      description={`截止日期: ${item.deadline}`}
                    />
                    <div className="task-status">
                      {getStatusTag(item.status)}
                      <Progress percent={item.progress} size="small" style={{ width: 100 }} />
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}
          {selectedMenu !== 'dashboard' && selectedMenu !== 'tasks' && (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#999' }}>功能开发中...</span>}
              />
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
