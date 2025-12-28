'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, message } from 'antd';
import '../../page.scss';

// Mock data type removed, using real data structure implied by API
interface Enterprise {
                  id: string;
                  name: string;
                  code: string;
                  status: 'active' | 'inactive';
                  users: number;
                  createdAt: string;
                  adminAccount?: string;
}

export default function EnterprisesPage() {
                  const [data, setData] = useState<Enterprise[]>([]);
                  const [loading, setLoading] = useState(false);
                  const [isModalOpen, setIsModalOpen] = useState(false);
                  const [confirmLoading, setConfirmLoading] = useState(false);
                  const [editingId, setEditingId] = useState<string | null>(null);
                  const [form] = Form.useForm();

                  const fetchEnterprises = async () => {
                                    setLoading(true);
                                    try {
                                                      const res = await fetch('/api/enterprises');
                                                      if (res.ok) {
                                                                        const jsonData = await res.json();
                                                                        setData(jsonData);
                                                      } else {
                                                                        message.error('获取企业列表失败');
                                                      }
                                    } catch (error) {
                                                      console.error('Fetch error:', error);
                                                      message.error('网络错误');
                                    } finally {
                                                      setLoading(false);
                                    }
                  };

                  useEffect(() => {
                                    fetchEnterprises();
                  }, []);

                  const handleOk = () => {
                                    form.validateFields()
                                                      .then(async (values) => {
                                                                        setConfirmLoading(true);
                                                                        try {
                                                                                          let res;
                                                                                          if (editingId) {
                                                                                                            // Update
                                                                                                            res = await fetch(`/api/enterprises/${editingId}`, {
                                                                                                                              method: 'PUT',
                                                                                                                              headers: { 'Content-Type': 'application/json' },
                                                                                                                              body: JSON.stringify(values),
                                                                                                            });
                                                                                          } else {
                                                                                                            // Create
                                                                                                            res = await fetch('/api/enterprises', {
                                                                                                                              method: 'POST',
                                                                                                                              headers: { 'Content-Type': 'application/json' },
                                                                                                                              body: JSON.stringify(values),
                                                                                                            });
                                                                                          }

                                                                                          if (res.ok) {
                                                                                                            message.success(editingId ? '企业更新成功' : '企业创建成功');
                                                                                                            setIsModalOpen(false);
                                                                                                            form.resetFields();
                                                                                                            setEditingId(null);
                                                                                                            fetchEnterprises(); // Refresh list
                                                                                          } else {
                                                                                                            const err = await res.json();
                                                                                                            message.error(err.error || '操作失败');
                                                                                          }
                                                                        } catch (error) {
                                                                                          console.error('Submit error:', error);
                                                                                          message.error('提交失败');
                                                                        } finally {
                                                                                          setConfirmLoading(false);
                                                                        }
                                                      })
                                                      .catch((info) => {
                                                                        console.log('Validate Failed:', info);
                                                      });
                  };

                  const handleCancel = () => {
                                    setIsModalOpen(false);
                                    form.resetFields();
                                    setEditingId(null);
                  };

                  const handleEdit = (record: Enterprise) => {
                                    setEditingId(record.id);
                                    form.setFieldsValue({
                                                      name: record.name,
                                                      code: record.code,
                                                      status: record.status,
                                                      adminAccount: record.adminAccount
                                    });
                                    setIsModalOpen(true);
                  };

                  const handleToggleStatus = (record: Enterprise) => {
                                    const newStatus = record.status === 'active' ? 'inactive' : 'active';
                                    const actionText = newStatus === 'active' ? '启用' : '停用';

                                    Modal.confirm({
                                                      title: `确认${actionText}该企业？`,
                                                      content: `确定要${actionText} "${record.name}" 吗？`,
                                                      onOk: async () => {
                                                                        try {
                                                                                          const res = await fetch(`/api/enterprises/${record.id}`, {
                                                                                                            method: 'PUT',
                                                                                                            headers: { 'Content-Type': 'application/json' },
                                                                                                            body: JSON.stringify({ status: newStatus }),
                                                                                          });

                                                                                          if (res.ok) {
                                                                                                            message.success(`已${actionText}企业`);
                                                                                                            fetchEnterprises();
                                                                                          } else {
                                                                                                            message.error('操作失败');
                                                                                          }
                                                                        } catch (e) {
                                                                                          message.error('网络错误');
                                                                        }
                                                      }
                                    });
                  };

                  const handleDelete = (record: Enterprise) => {
                                    Modal.confirm({
                                                      title: '确认删除该企业？',
                                                      content: `确定要删除 "${record.name}" 吗？此操作不可恢复。`,
                                                      okType: 'danger',
                                                      onOk: async () => {
                                                                        try {
                                                                                          const res = await fetch(`/api/enterprises/${record.id}`, {
                                                                                                            method: 'DELETE',
                                                                                          });
                                                                                          if (res.ok) {
                                                                                                            message.success('已删除企业');
                                                                                                            fetchEnterprises();
                                                                                          } else {
                                                                                                            message.error('删除失败');
                                                                                          }
                                                                        } catch (e) {
                                                                                          message.error('网络错误');
                                                                        }
                                                      }
                                    });
                  };

                  const columns = [
                                    { title: '企业名称', dataIndex: 'name', key: 'name' },
                                    { title: '企业代码', dataIndex: 'code', key: 'code' },
                                    // Note: adminAccount might not be efficiently retrievable in list view without extra queries, 
                                    // relying on what GET api returns. If API doesn't return it (for security), we might simply not show it 
                                    // or show it only on Edit. For now, assuming GET returns it if available.
                                    { title: '企业账号', dataIndex: 'adminAccount', key: 'adminAccount' },
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
                                                      render: (_: any, record: Enterprise) => (
                                                                        <Space>
                                                                                          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
                                                                                          <Button
                                                                                                            type="link"
                                                                                                            size="small"
                                                                                                            danger={record.status === 'active'}
                                                                                                            onClick={() => handleToggleStatus(record)}
                                                                                          >
                                                                                                            {record.status === 'active' ? '停用' : '启用'}
                                                                                          </Button>
                                                                                          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
                                                                        </Space>
                                                      )
                                    }
                  ];

                  return (
                                    <>
                                                      <Card
                                                                        title="企业管理"
                                                                        extra={
                                                                                          <Button type="primary" onClick={() => {
                                                                                                            setEditingId(null);
                                                                                                            form.resetFields();
                                                                                                            setIsModalOpen(true);
                                                                                          }}>
                                                                                                            添加企业
                                                                                          </Button>
                                                                        }
                                                      >
                                                                        <Table
                                                                                          columns={columns}
                                                                                          dataSource={data}
                                                                                          rowKey="id"
                                                                                          loading={loading}
                                                                        />
                                                      </Card>

                                                      <Modal
                                                                        title={editingId ? "编辑企业" : "添加企业"}
                                                                        open={isModalOpen}
                                                                        onOk={handleOk}
                                                                        confirmLoading={confirmLoading}
                                                                        onCancel={handleCancel}
                                                                        okText="确定"
                                                                        cancelText="取消"
                                                      >
                                                                        <Form
                                                                                          form={form}
                                                                                          layout="vertical"
                                                                                          name="form_in_modal"
                                                                                          initialValues={{ status: 'active' }}
                                                                        >
                                                                                          <Form.Item
                                                                                                            name="name"
                                                                                                            label="企业名称"
                                                                                                            rules={[{ required: true, message: '请输入企业名称' }]}
                                                                                          >
                                                                                                            <Input placeholder="请输入企业名称" />
                                                                                          </Form.Item>
                                                                                          <Form.Item
                                                                                                            name="code"
                                                                                                            label="企业代码"
                                                                                                            rules={[{ required: true, message: '请输入企业代码' }]}
                                                                                          >
                                                                                                            <Input placeholder="请输入企业代码 (如: ENT001)" />
                                                                                          </Form.Item>
                                                                                          <Form.Item
                                                                                                            name="adminAccount"
                                                                                                            label="企业账号"
                                                                                                            rules={[{ required: !editingId, message: '请输入企业账号' }]}
                                                                                          >
                                                                                                            <Input placeholder={editingId ? "修改管理员账号(可选)" : "请输入企业管理员账号"} />
                                                                                          </Form.Item>
                                                                                          <Form.Item
                                                                                                            name="initialPassword"
                                                                                                            label="初始密码"
                                                                                                            rules={[{ required: !editingId, message: '请输入初始密码' }]}
                                                                                                            hidden={!!editingId}
                                                                                          >
                                                                                                            <Input.Password placeholder="请输入初始密码" />
                                                                                          </Form.Item>
                                                                                          <Form.Item
                                                                                                            name="status"
                                                                                                            label="状态"
                                                                                                            className="collection-create-form_last-form-item"
                                                                                          >
                                                                                                            <Select>
                                                                                                                              <Select.Option value="active">正常</Select.Option>
                                                                                                                              <Select.Option value="inactive">停用</Select.Option>
                                                                                                            </Select>
                                                                                          </Form.Item>
                                                                        </Form>
                                                      </Modal>
                                    </>
                  );
}
