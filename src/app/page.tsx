'use client';

import { Button, Card, Space } from 'antd';
import {
  RocketOutlined,
  BankOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import './page.scss';

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <div className="hero-section">
          <div className="logo-box">
            <RocketOutlined className="logo-icon" />
          </div>
          <h1>战略解码</h1>
          <p>企业战略解码与绩效管理平台</p>
        </div>

        <div className="portals-grid">
          <Card className="portal-card admin">
            <SettingOutlined className="portal-icon" />
            <h3>平台管理后台</h3>
            <p>系统管理、企业管理、数据统计</p>
            <Link href="/admin">
              <Button type="primary" size="large">进入管理后台</Button>
            </Link>
          </Card>

          <Card className="portal-card enterprise">
            <BankOutlined className="portal-icon" />
            <h3>企业端</h3>
            <p>战略解码、组织管理、绩效考核</p>
            <Link href="/enterprise">
              <Button type="primary" size="large">进入企业端</Button>
            </Link>
          </Card>

          <Card className="portal-card employee">
            <UserOutlined className="portal-icon" />
            <h3>员工端</h3>
            <p>个人目标、任务执行、绩效查看</p>
            <Link href="/employee">
              <Button type="primary" size="large">进入员工端</Button>
            </Link>
          </Card>
        </div>

        <div className="footer">
          <Space size="large">
            <span>技术架构: Next.js + React + Prisma + MySQL</span>
            <span>|</span>
            <span>认证: JWT</span>
          </Space>
        </div>
      </div>
    </div>
  );
}
