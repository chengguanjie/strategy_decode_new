'use client';

import { Card, Statistic, Row, Col, Table, Tag, Space, Button } from 'antd';
import {
                  BankOutlined,
                  TeamOutlined,
                  UserOutlined,
} from '@ant-design/icons';
import '../../page.scss';

const mockEnterprises = [
                  { id: '1', name: '示例企业A', code: 'ENT001', status: 'active', users: 45, createdAt: '2024-01-15' },
                  { id: '2', name: '示例企业B', code: 'ENT002', status: 'active', users: 128, createdAt: '2024-02-20' },
                  { id: '3', name: '示例企业C', code: 'ENT003', status: 'inactive', users: 23, createdAt: '2024-03-10' },
];

export default function DashboardPage() {
                  const columns = [
                                    { title: '企业名称', dataIndex: 'name', key: 'name' },
                                    { title: '企业代码', dataIndex: 'code', key: 'code' },
                                    {
                                                      title: '状态',
                                                      dataIndex: 'status',
                                                      key: 'status',
                                                      render: (status: string) => (
                                                                        <Tag color={status === 'active' ? 'green' : 'default'}>
                                                                                          {status === 'active' ? '正常' : '停用'}
                                                                        </Tag>
                                                      )
                                    },
                                    { title: '用户数', dataIndex: 'users', key: 'users' },
                                    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
                                    {
                                                      title: '操作',
                                                      key: 'action',
                                                      render: () => (
                                                                        <Space>
                                                                                          <Button type="link" size="small">编辑</Button>
                                                                                          <Button type="link" size="small" danger>停用</Button>
                                                                        </Space>
                                                      )
                                    }
                  ];

                  return (
                                    <>
                                                      <Row gutter={24} className="stats-row">
                                                                        <Col span={6}>
                                                                                          <Card>
                                                                                                            <Statistic title="企业总数" value={156} prefix={<BankOutlined />} />
                                                                                          </Card>
                                                                        </Col>
                                                                        <Col span={6}>
                                                                                          <Card>
                                                                                                            <Statistic title="用户总数" value={3842} prefix={<TeamOutlined />} />
                                                                                          </Card>
                                                                        </Col>
                                                                        <Col span={6}>
                                                                                          <Card>
                                                                                                            <Statistic title="活跃企业" value={132} prefix={<BankOutlined />} valueStyle={{ color: '#52c41a' }} />
                                                                                          </Card>
                                                                        </Col>
                                                                        <Col span={6}>
                                                                                          <Card>
                                                                                                            <Statistic title="本月新增" value={28} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} />
                                                                                          </Card>
                                                                        </Col>
                                                      </Row>
                                                      <Card title="最近注册企业" className="recent-card">
                                                                        <Table columns={columns} dataSource={mockEnterprises} rowKey="id" pagination={false} />
                                                      </Card>
                                    </>
                  );
}
