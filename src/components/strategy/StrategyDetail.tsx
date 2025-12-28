'use client';

import React, { useState, memo } from 'react';
import {
  Typography,
  Card,
  Tag,
  Button,
  Divider,
} from 'antd';
import {
  BulbOutlined,
  AimOutlined,
  ThunderboltOutlined,
  BookOutlined,
  AreaChartOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { BlockContent } from '@/types';
import StrategyHeader from './StrategyHeader';
import FinancialTable from './FinancialTable';
import MarketSelectionTable from './MarketSelectionTable';
import CustomerStructureTabs from './CustomerStructureTabs';
import ValueCompetitionTable from './ValueCompetitionTable';
import DepartmentStrategyTable from './DepartmentStrategyTable';
import BusinessProcessTable from './BusinessProcessTable';
import TeamEfficiencyTable from './TeamEfficiencyTable';
import ReviewManagementTable from './ReviewManagementTable';
import './StrategyDetail.scss';

const { Title, Paragraph, Text } = Typography;

/**
 * Props for the StrategyDetail component
 */
interface StrategyDetailProps {
  /** The content block to display */
  content: BlockContent;
  /** Callback when adding a new point */
  onAddPoint?: (text: string) => void;
  /** Callback when adding a new action */
  onAddAction?: (text: string) => void;
  /** Callback when adding a new metric */
  onAddMetric?: (text: string) => void;
  /** Optional department name for context */
  departmentName?: string;
}

// Component configuration mapping
interface ComponentConfig {
  icon: React.ReactNode;
  iconBoxClass?: string;
  showFontSize: boolean;
  component: React.ComponentType<{ fontSize?: number }>;
  showDepartmentInTitle?: boolean;
}

const COMPONENT_MAP: Record<string, ComponentConfig> = {
  '经营目标': {
    icon: <AreaChartOutlined />,
    iconBoxClass: 'blue',
    showFontSize: false,
    component: FinancialTable,
    showDepartmentInTitle: false,
  },
  '市场选择': {
    icon: <AimOutlined />,
    showFontSize: true,
    component: MarketSelectionTable,
    showDepartmentInTitle: false,
  },
  '客户结构': {
    icon: <BulbOutlined />,
    showFontSize: true,
    component: CustomerStructureTabs,
    showDepartmentInTitle: false,
  },
  '价值竞争': {
    icon: <ThunderboltOutlined />,
    showFontSize: true,
    component: ValueCompetitionTable,
    showDepartmentInTitle: false,
  },
  '战略承接': {
    icon: <AimOutlined />,
    showFontSize: true,
    component: DepartmentStrategyTable,
    showDepartmentInTitle: true,
  },
  '业务流程': {
    icon: <BookOutlined />,
    showFontSize: true,
    component: BusinessProcessTable,
    showDepartmentInTitle: true,
  },
  '团队效能': {
    icon: <ThunderboltOutlined />,
    showFontSize: true,
    component: TeamEfficiencyTable,
    showDepartmentInTitle: true,
  },
  '复盘管理': {
    icon: <BookOutlined />,
    showFontSize: true,
    component: ReviewManagementTable,
    showDepartmentInTitle: true,
  },
};

/**
 * DefaultContentView - Fallback view for unmapped content titles
 * Displays a generic strategy detail layout with editable sections
 */
const DefaultContentView: React.FC<{
  content: BlockContent;
  departmentName?: string;
}> = memo(function DefaultContentView({ content, departmentName }) {
  return (
    <div className="strategy-detail-container">
      <div className="detail-header">
        <div className="header-icon-box">
          <BulbOutlined />
        </div>
        <div className="header-text">
          <Title level={2}>{content.title}</Title>
          <Text type="secondary">{departmentName ? `${departmentName} - 战略解码与执行路径规划` : '战略解码与执行路径规划'}</Text>
        </div>
        <div className="ai-status">
          <Tag color="purple" icon={<ThunderboltOutlined />}>AI 辅助已就绪</Tag>
        </div>
      </div>

      <Divider />

      <Card className="section-card problem-card" bordered={false}>
        <div className="card-title">
          <AimOutlined className="icon-red" />
          <h3>核心问题 (Core Problem)</h3>
        </div>
        <div className="card-content-box highlight-bg">
          <Paragraph className="editable-paragraph" editable={{ icon: <EditOutlined /> }}>
            {content.coreProblem}
          </Paragraph>
        </div>
      </Card>

      <Card className="section-card" bordered={false}>
        <div className="card-title">
          <BookOutlined className="icon-blue" />
          <h3>知识/方法论 (Framework)</h3>
        </div>
        <div className="tags-container">
          {content.knowledgeFramework.map((tag, idx) => (
            <Tag key={idx} color="geekblue" className="custom-tag">{tag}</Tag>
          ))}
          <Tag icon={<PlusOutlined />} className="add-tag">添加</Tag>
        </div>
      </Card>

      <div className="columns-grid">
        <Card className="grid-card" title="必赢之战 (Must-Win Battles)">
          <ul className="custom-list">
            {content.winningPoints.map((point, idx) => (
              <li key={idx}><span className="bullet"></span>{point}</li>
            ))}
          </ul>
          <Button type="dashed" block icon={<PlusOutlined />} size="small">添加战役</Button>
        </Card>

        <Card className="grid-card" title="行动计划 (Action Plan)">
          <ul className="custom-list">
            {content.actionPlan.map((action, idx) => (
              <li key={idx}><span className="bullet"></span>{action}</li>
            ))}
          </ul>
          <Button type="dashed" block icon={<PlusOutlined />} size="small">添加计划</Button>
        </Card>

        <Card className="grid-card" title="衡量指标 (Key Metrics)">
          <ul className="custom-list">
            {content.keyMetrics.map((metric, idx) => (
              <li key={idx}><span className="bullet"></span>{metric}</li>
            ))}
          </ul>
          <Button type="dashed" block icon={<PlusOutlined />} size="small">添加指标</Button>
        </Card>
      </div>
    </div>
  );
});

/**
 * StrategyDetail - Main component for displaying strategy detail content
 * Renders different table components based on the content title
 */
const StrategyDetail: React.FC<StrategyDetailProps> = memo(function StrategyDetail({ content, departmentName }) {
  const [fontSize, setFontSize] = useState(18);

  // Check if we have a mapped component for this title
  const config = COMPONENT_MAP[content.title];

  if (!config) {
    return <DefaultContentView content={content} departmentName={departmentName} />;
  }

  const { icon, iconBoxClass, showFontSize, component: TableComponent, showDepartmentInTitle } = config;

  return (
    <div className="strategy-detail-container">
      <StrategyHeader
        title={content.title}
        departmentName={showDepartmentInTitle ? departmentName : undefined}
        icon={icon}
        iconBoxClass={iconBoxClass}
        showFontSize={showFontSize}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
      <TableComponent fontSize={fontSize} />
    </div>
  );
});

export default StrategyDetail;
