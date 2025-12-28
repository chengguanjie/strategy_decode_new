'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import './login.scss';

const { Title } = Typography;

export default function EnterpriseLoginPage() {
                  const [loading, setLoading] = useState(false);
                  const router = useRouter();

                  const onFinish = async (values: any) => {
                                    setLoading(true);
                                    try {
                                                      const response = await fetch('/api/auth/login', {
                                                                        method: 'POST',
                                                                        headers: {
                                                                                          'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                                          email: values.email,
                                                                                          password: values.password,
                                                                        }),
                                                      });

                                                      const data = await response.json();

                                                      if (response.ok && data.success) {
                                                                        message.success('登录成功');
                                                                        // Store token and user info
                                                                        localStorage.setItem('token', data.data.token);
                                                                        localStorage.setItem('user', JSON.stringify(data.data.user));

                                                                        // Redirect to enterprise dashboard
                                                                        router.push('/enterprise');
                                                      } else {
                                                                        message.error(data.error?.message || '登录失败，请检查账号密码');
                                                      }
                                    } catch (error) {
                                                      console.error('Login error:', error);
                                                      message.error('登录发生错误，请稍后重试');
                                    } finally {
                                                      setLoading(false);
                                    }
                  };

                  return (
                                    <div className="enterprise-login-page">
                                                      <div className="login-container">
                                                                        <div className="login-header">
                                                                                          <BankOutlined className="logo-icon" />
                                                                                          <Title level={2} className="login-title">企业端登录</Title>
                                                                                          <p className="login-subtitle">战略绩效解码平台</p>
                                                                        </div>

                                                                        <Card className="login-card" bordered={false}>
                                                                                          <Form
                                                                                                            name="enterprise_login"
                                                                                                            className="login-form"
                                                                                                            initialValues={{ remember: true }}
                                                                                                            onFinish={onFinish}
                                                                                                            size="large"
                                                                                          >
                                                                                                            <Form.Item
                                                                                                                              name="email"
                                                                                                                              rules={[{ required: true, message: '请输入企业账号!' }]}
                                                                                                            >
                                                                                                                              <Input
                                                                                                                                                prefix={<UserOutlined className="site-form-item-icon" />}
                                                                                                                                                placeholder="企业账号 / 邮箱"
                                                                                                                              />
                                                                                                            </Form.Item>
                                                                                                            <Form.Item
                                                                                                                              name="password"
                                                                                                                              rules={[{ required: true, message: '请输入密码!' }]}
                                                                                                            >
                                                                                                                              <Input.Password
                                                                                                                                                prefix={<LockOutlined className="site-form-item-icon" />}
                                                                                                                                                type="password"
                                                                                                                                                placeholder="密码"
                                                                                                                              />
                                                                                                            </Form.Item>

                                                                                                            <Form.Item>
                                                                                                                              <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                                                                                                                                                登录
                                                                                                                              </Button>
                                                                                                            </Form.Item>
                                                                                          </Form>
                                                                        </Card>
                                                      </div>
                                    </div>
                  );
}
