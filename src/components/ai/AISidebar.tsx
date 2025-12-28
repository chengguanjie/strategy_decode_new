'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Modal, Table, message, Select, Tooltip, List, Empty } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  CheckOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined
} from '@ant-design/icons';
import './AISidebar.scss';

const AI_MODELS = [
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
  { value: 'anthropic/claude-sonnet-4.5:thinking', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-haiku-4.5:thinking', label: 'Claude Haiku 4.5' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  { value: 'google/gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'openai/gpt-5.2', label: 'GPT-5.2' },
  { value: 'openai/gpt-5.1-codex-max', label: 'GPT-5.1 Codex' },
  { value: 'deepseek/deepseek-v3.2-think', label: 'DeepSeek V3.2' },
  { value: 'bigmodel/glm-4.7', label: 'GLM 4.7' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  id: string;
  title: string;
  pageTitle: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface TableUpdate {
  rowIndex: number;
  column: string;
  oldValue: string;
  newValue: string;
}

interface AISidebarProps {
  pageTitle: string;
  pageContent: string;
  onApplyUpdates?: (updates: TableUpdate[]) => void;
}

const STORAGE_KEY = 'ai_chat_history';

const getWelcomeMessage = (pageTitle: string): string => {
  switch (pageTitle) {
    case '战略承接':
      return `您好！

我可以帮您完善「战略承接」页面的内容。您可以：

1. **咨询问题** - 询问关于战略承接的任何问题
2. **完善内容** - 优化现有的知识框架、制胜要点、行动计划等
3. **更新表格** - 修改或新增任何模块的内容

当前页面聚焦的核心问题是：**如何确保战略目标能够被准确地拆解并执行到位，避免"上面千条线，下面一根针"的断层？**

请问您想从哪里开始？比如：
- 需要深入了解某个知识框架（如BEM模型、战略解码六步法）？
- 想要补充或优化某个模块的内容？
- 有具体的战略承接问题需要探讨？`;

    case '经营目标':
      return `您好！

我可以帮您完善「经营目标」页面的财务指标推演。您可以：

1. **分析财务数据** - 帮您分析收入、利润、成本等指标的合理性
2. **目标设定** - 协助制定具有挑战性但可实现的年度目标
3. **趋势预测** - 基于历史数据推演未来发展趋势

当前表格包含：收入、边界利润、固定成本、利润、应收账款、库存等核心财务指标。

请问您想：
- 评估当前目标设定是否合理？
- 分析各指标之间的关联性？
- 探讨如何优化某项具体指标？`;

    case '市场选择':
      return `您好！

我可以帮您完善「市场选择」页面的市场战略规划。您可以：

1. **市场分析** - 深入分析各细分市场的机会与挑战
2. **定位优化** - 完善各业务类型的经营定位
3. **增长策略** - 识别并规划关键增长点

当前表格维度包括：业务类型、细分市场、经营定位、增长点、内部要求。

请问您想：
- 分析某个细分市场的竞争格局？
- 优化某个业务类型的市场定位？
- 探讨如何发掘新的增长点？`;

    case '客户结构':
      return `您好！

我可以帮您完善「客户结构」页面的客户战略规划。该页面包含三个核心模块：

1. **北极星客户画像** - 定义理想客户的特征与画像
2. **北极星客户盘点** - 盘点现有客户与理想客户的匹配度
3. **客户组合规划** - 制定客户组合优化策略

请问您想：
- 完善理想客户的画像描述？
- 分析现有客户结构的健康度？
- 规划客户组合的优化路径？`;

    case '价值竞争':
      return `您好！

我可以帮您完善「价值竞争」页面的竞争分析与策略。您可以：

1. **竞争分析** - 对标竞争对手，分析各价值维度的差距
2. **策略制定** - 针对不同客户类型制定差异化竞争策略
3. **部门协同** - 明确各部门在竞争中需要承担的职责

当前表格维度包括：客户类型、价值维度、企业对比、竞争策略、部门要求。

请问您想：
- 深入分析某个价值维度的竞争态势？
- 优化针对特定客户类型的竞争策略？
- 明确部门的具体行动要求？`;

    case '业务流程':
      return `您好！

我可以帮您完善「业务流程」页面的流程分析与优化。您可以：

1. **问题诊断** - 识别业务流程中的核心瓶颈问题
2. **原因分析** - 深入挖掘问题背后的关键原因
3. **对策制定** - 制定可落地的解决方案

当前表格维度包括：业务流程、数据统计、核心问题、关键原因、解决对策。

请问您想：
- 分析某个业务流程的效率问题？
- 探讨如何优化流程瓶颈？
- 制定具体的改进措施？`;

    case '团队效能':
      return `您好！

我可以帮您完善「团队效能」页面的团队能力分析。您可以：

1. **现状评估** - 评估团队在各维度的当前水平
2. **差距分析** - 识别与目标状态的能力差距
3. **AI赋能** - 探索AI如何提升团队效能

当前表格涵盖五大维度：知识结构、工作效率、时间管理、思维方式、激情状态。

请问您想：
- 评估团队某个维度的能力水平？
- 探讨提升团队效能的具体方法？
- 了解AI如何赋能团队工作？`;

    case '复盘管理':
      return `您好！

我可以帮您完善「复盘管理」页面的复盘分析。您可以：

1. **复盘方法** - 提供结构化的复盘框架与方法
2. **经验提炼** - 帮助提炼成功经验与失败教训
3. **改进计划** - 制定下一阶段的改进行动计划

请问您想：
- 了解如何进行有效的战略复盘？
- 分析某个具体项目或阶段的得失？
- 制定改进措施与行动计划？`;

    default:
      return `您好！

我可以帮您完善「${pageTitle}」页面的内容。您可以：

1. **咨询问题** - 询问关于${pageTitle}的任何问题
2. **完善内容** - 优化现有的框架和内容
3. **更新表格** - 修改或新增表格中的数据

请问有什么可以帮您的？`;
  }
};

const AISidebar: React.FC<AISidebarProps> = ({ pageTitle, pageContent, onApplyUpdates }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<TableUpdate[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAiConfig(config);
      setSelectedModel(config.model || AI_MODELS[0].value);
    } else {
      setSelectedModel(AI_MODELS[0].value);
    }

    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  const saveHistory = (history: ChatHistory[]) => {
    setChatHistory(history);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  };

  const saveCurrentChat = (newMessages: Message[]) => {
    if (newMessages.length <= 1) return;

    const now = new Date().toISOString();
    const firstUserMessage = newMessages.find(m => m.role === 'user');
    const title = firstUserMessage?.content.slice(0, 30) || '新对话';

    if (currentChatId) {
      const updatedHistory = chatHistory.map(h =>
        h.id === currentChatId
          ? { ...h, messages: newMessages, updatedAt: now }
          : h
      );
      saveHistory(updatedHistory);
    } else {
      const newId = Date.now().toString();
      setCurrentChatId(newId);
      const newChat: ChatHistory = {
        id: newId,
        title,
        pageTitle,
        messages: newMessages,
        createdAt: now,
        updatedAt: now
      };
      saveHistory([newChat, ...chatHistory].slice(0, 50));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!collapsed && messages.length === 0 && !currentChatId) {
      setMessages([{
        role: 'assistant',
        content: getWelcomeMessage(pageTitle)
      }]);
    }
  }, [collapsed, pageTitle, messages.length, currentChatId]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    if (!aiConfig?.apiKey) {
      message.warning('请先在系统设置中配置 AI API 密钥');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        ...aiConfig,
        model: selectedModel
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            pageTitle,
            pageContent
          },
          config
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedMessages = [...newMessages, { role: 'assistant' as const, content: data.content }];
        setMessages(updatedMessages);
        saveCurrentChat(updatedMessages);

        if (data.tableUpdates && data.tableUpdates.length > 0) {
          setPendingUpdates(data.tableUpdates);
        }
      } else {
        const errorMessages = [...newMessages, {
          role: 'assistant' as const,
          content: '抱歉，请求失败，请稍后重试。'
        }];
        setMessages(errorMessages);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了网络错误，请稍后重试。'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([{
      role: 'assistant',
      content: getWelcomeMessage(pageTitle)
    }]);
    setPendingUpdates([]);
  };

  const handleClearChat = () => {
    Modal.confirm({
      title: '清空对话',
      content: '确定要清空当前对话吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: handleNewChat
    });
  };

  const handleLoadHistory = (history: ChatHistory) => {
    setCurrentChatId(history.id);
    setMessages(history.messages);
    setShowHistoryModal(false);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = chatHistory.filter(h => h.id !== id);
    saveHistory(updatedHistory);
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleApplyUpdates = () => {
    if (onApplyUpdates && pendingUpdates.length > 0) {
      onApplyUpdates(pendingUpdates);
      message.success('已更新表格内容');
    }
    setPendingUpdates([]);
    setShowConfirmModal(false);
  };

  const updateColumns = [
    { title: '行', dataIndex: 'rowIndex', key: 'rowIndex', width: 60, render: (v: number) => v + 1 },
    { title: '列', dataIndex: 'column', key: 'column', width: 100 },
    { title: '原值', dataIndex: 'oldValue', key: 'oldValue' },
    { title: '新值', dataIndex: 'newValue', key: 'newValue' }
  ];

  return (
    <>
      <div className={`ai-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="ai-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? (
            <>
              <RobotOutlined />
              <span className="toggle-text">AI</span>
            </>
          ) : (
            <CloseOutlined />
          )}
        </div>

        {!collapsed && (
          <div className="ai-content">
            <div className="ai-header">
              <RobotOutlined className="ai-icon" />
              <span>AI 助手</span>
              <div className="header-actions">
                <Tooltip title="新对话">
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleNewChat}
                    className="header-btn"
                  />
                </Tooltip>
                <Tooltip title="历史记录">
                  <Button
                    type="text"
                    icon={<HistoryOutlined />}
                    onClick={() => setShowHistoryModal(true)}
                    className="header-btn"
                  />
                </Tooltip>
                <Tooltip title="清空对话">
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={handleClearChat}
                    className="header-btn"
                  />
                </Tooltip>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setCollapsed(true)}
                  className="header-btn close-btn"
                />
              </div>
            </div>

            <div className="ai-model-select">
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                options={AI_MODELS}
                style={{ width: '100%' }}
                size="small"
                placeholder="选择模型"
              />
            </div>

            <div className="ai-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-content">
                    <Spin size="small" /> 思考中...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {pendingUpdates.length > 0 && (
              <div className="pending-updates">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => setShowConfirmModal(true)}
                  block
                >
                  应用到表格 ({pendingUpdates.length} 项更新)
                </Button>
              </div>
            )}

            <div className="ai-input-area">
              <Input
                placeholder="输入问题..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        title="确认更新表格内容"
        open={showConfirmModal}
        onOk={handleApplyUpdates}
        onCancel={() => setShowConfirmModal(false)}
        okText="确认更新"
        cancelText="取消"
        width={700}
      >
        <p>以下内容将被更新：</p>
        <Table
          dataSource={pendingUpdates.map((u, i) => ({ ...u, key: i }))}
          columns={updateColumns}
          pagination={false}
          size="small"
        />
      </Modal>

      <Modal
        title="历史记录"
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={null}
        width={500}
      >
        {chatHistory.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <List
            className="history-list"
            dataSource={chatHistory}
            renderItem={item => (
              <List.Item
                className="history-item"
                onClick={() => handleLoadHistory(item)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <span className="history-meta">
                      {item.pageTitle} · {new Date(item.updatedAt).toLocaleString()}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default AISidebar;
