'use client';

import { Layout, Menu, Button, Space } from 'antd';
import {
                  DashboardOutlined,
                  BankOutlined,
                  UserOutlined,
                  SettingOutlined,
                  BarChartOutlined,
                  LogoutOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import './page.scss';

const { Sider, Header, Content } = Layout;

export default function AdminLayout({
                  children,
}: {
                  children: React.ReactNode;
}) {
                  const router = useRouter();
                  const pathname = usePathname();

                  // Determine selected key based on pathname
                  const getSelectedKey = () => {
                                    if (pathname.includes('/admin/dashboard')) return 'dashboard';
                                    if (pathname.includes('/admin/enterprises')) return 'enterprises';
                                    if (pathname.includes('/admin/users')) return 'users';
                                    if (pathname.includes('/admin/statistics')) return 'statistics';
                                    if (pathname.includes('/admin/settings')) return 'settings';
                                    return 'dashboard';
                  };

                  return (
                                    <Layout className="admin-layout">
                                                      <Sider theme="dark" width={220}>
                                                                        <div className="admin-logo">
                                                                                          <SettingOutlined className="logo-icon" />
                                                                                          <span>平台管理后台</span>
                                                                        </div>
                                                                        <Menu
                                                                                          theme="dark"
                                                                                          mode="inline"
                                                                                          selectedKeys={[getSelectedKey()]}
                                                                                          onClick={({ key }) => router.push(`/admin/${key}`)}
                                                                                          items={[
                                                                                                            { key: 'dashboard', icon: <DashboardOutlined />, label: '控制台' },
                                                                                                            { key: 'enterprises', icon: <BankOutlined />, label: '企业管理' },
                                                                                                            { key: 'users', icon: <UserOutlined />, label: '用户管理' },
                                                                                                            { key: 'statistics', icon: <BarChartOutlined />, label: '数据统计' },
                                                                                                            { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
                                                                                          ]}
                                                                        />
                                                                        <div className="nav-bottom">
                                                                                          <Link href="/">
                                                                                                            <Button type="text" block style={{ color: 'rgba(255,255,255,0.65)' }}>
                                                                                                                              返回首页
                                                                                                            </Button>
                                                                                          </Link>
                                                                        </div>
                                                      </Sider>
                                                      <Layout>
                                                                        <Header className="admin-header">
                                                                                          <h2>平台管理后台</h2>
                                                                                          <Space>
                                                                                                            <span>管理员</span>
                                                                                                            <Button type="link" icon={<LogoutOutlined />}>退出</Button>
                                                                                          </Space>
                                                                        </Header>
                                                                        <Content className="admin-content">
                                                                                          {children}
                                                                        </Content>
                                                      </Layout>
                                    </Layout>
                  );
}
