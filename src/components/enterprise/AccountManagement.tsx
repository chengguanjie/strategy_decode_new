'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, List, Avatar, Button, Modal, Form, Input, Select, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AccountManagementProps {
  currentUserId?: string;
}

export default function AccountManagement({ currentUserId }: AccountManagementProps) {
  const [userList, setUserList] = useState<EnterpriseUser[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setUserListLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/enterprise/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        // API 返回格式: { success: true, data: [...] }
        const userListData = result.data || result;
        setUserList(Array.isArray(userListData) ? userListData : []);
      } else {
        message.error('获取用户列表失败');
      }
    } catch (e) {
      console.error(e);
      message.error('网络错误');
    } finally {
      setUserListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    try {
      const values = await userForm.validateFields();
      const token = localStorage.getItem('token');
      const res = await fetch('/api/enterprise/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      const data = await res.json();
      if (res.ok) {
        message.success('管理员添加成功');
        setIsUserModalOpen(false);
        userForm.resetFields();
        fetchUsers();
      } else {
        message.error(data.error?.message || '添加失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = (user: EnterpriseUser) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除管理员 "${user.name}" 吗？`,
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/enterprise/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            message.success('删除成功');
            fetchUsers();
          } else {
            const data = await res.json();
            message.error(data.error?.message || '删除失败');
          }
        } catch (e) {
          message.error('网络错误');
        }
      }
    });
  };

  const getRoleDisplayName = (role: string, index: number) => {
    if (role === 'ENTERPRISE_ADMIN') {
      return index === 0 ? '超级管理员' : '普通管理员';
    }
    return '员工';
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card
        title="账号管理"
        bordered={false}
        extra={
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => setIsUserModalOpen(true)}
          >
            添加管理员
          </Button>
        }
      >
        <List
          loading={userListLoading}
          itemLayout="horizontal"
          dataSource={userList}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                (item.id !== currentUserId && index !== 0) && (
                  <Button
                    type="link"
                    danger
                    key="delete"
                    onClick={() => handleDeleteUser(item)}
                  >
                    删除
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.name}
                description={`${item.email} - ${getRoleDisplayName(item.role, index)}`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="添加管理员"
        open={isUserModalOpen}
        onOk={handleCreateUser}
        onCancel={() => setIsUserModalOpen(false)}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入管理员姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="登录账号(邮箱)"
            rules={[{ required: true, message: '请输入登录账号' }, { type: 'email', message: '请输入有效的邮箱格式' }]}
          >
            <Input placeholder="请输入登录邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码"
            rules={[{ required: true, message: '请输入初始密码' }]}
          >
            <Input.Password placeholder="请输入初始密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            initialValue="ENTERPRISE_ADMIN"
          >
            <Select>
              <Select.Option value="ENTERPRISE_ADMIN">普通管理员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
