'use client';

import React from 'react';
import { Card, Avatar, List } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface EnterpriseInfo {
  createdAt?: string;
}

interface ProfilePanelProps {
  currentUser: UserInfo | null;
  enterpriseInfo: EnterpriseInfo | null;
}

export default function ProfilePanel({ currentUser, enterpriseInfo }: ProfilePanelProps) {
  const profileData = [
    { title: '企业账号', desc: currentUser?.email || '-' },
    { title: '用户身份', desc: currentUser?.role === 'ENTERPRISE_ADMIN' ? '企业管理员' : '普通员工' },
    { title: '注册时间', desc: enterpriseInfo?.createdAt ? new Date(enterpriseInfo.createdAt).toLocaleDateString('zh-CN') : '-' },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="个人中心" bordered={false}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
          <h3>{currentUser?.name || '管理员'}</h3>
          <p>{currentUser?.email}</p>
        </div>
        <List
          itemLayout="horizontal"
          dataSource={profileData}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={item.desc}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
