'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Space, message } from 'antd';
import { AI_MODELS } from '@/lib/constants';

interface AIConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  contextInfo: string;
}

interface AIConfigPanelProps {
  initialConfig: AIConfig;
  onConfigChange: (config: AIConfig) => void;
}

export default function AIConfigPanel({ initialConfig, onConfigChange }: AIConfigPanelProps) {
  const [aiConfigForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  // Initialize form with initial config
  React.useEffect(() => {
    aiConfigForm.setFieldsValue(initialConfig);
  }, [initialConfig, aiConfigForm]);

  const handleSaveAiConfig = () => {
    aiConfigForm.validateFields().then(values => {
      onConfigChange(values);
      localStorage.setItem('ai_config', JSON.stringify(values));
      message.success('AI 配置已保存');
    });
  };

  const handleTestConnection = async () => {
    try {
      const values = await aiConfigForm.validateFields();
      setTestingConnection(true);

      // 使用服务器端代理 API 避免 CORS 问题
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: values.apiBaseUrl,
          apiKey: values.apiKey,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(`连接测试成功！API 配置有效，共 ${result.data?.modelCount || 0} 个可用模型。`);
      } else {
        message.error(`连接测试失败: ${result.error?.message || '未知错误'}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`连接测试失败: ${errorMessage}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="AI 配置" bordered={false}>
        <Form
          form={aiConfigForm}
          layout="vertical"
          initialValues={initialConfig}
        >
          <Form.Item
            name="apiBaseUrl"
            label="API Base URL"
            rules={[{ required: true, message: '请输入 API Base URL' }]}
          >
            <Input placeholder="https://router.shengsuanyun.com/api/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Form.Item
            name="model"
            label="模型选择"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select placeholder="请选择模型">
              {AI_MODELS.map(model => (
                <Select.Option key={model.value} value={model.value}>
                  {model.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contextInfo"
            label="AI 背景信息"
            extra="此信息将作为上下文参考，帮助 AI 更好地理解您的业务场景和需求。"
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入企业背景、业务领域、战略目标等相关信息...&#10;例如：&#10;- 公司名称和行业&#10;- 主营业务&#10;- 核心竞争力&#10;- 战略方向"
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSaveAiConfig}>
                保存配置
              </Button>
              <Button onClick={handleTestConnection} loading={testingConnection}>
                测试连接
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
