'use client';

import React, { memo } from 'react';
import { Typography, Button, Popover, Slider, Divider } from 'antd';
import { FontSizeOutlined } from '@ant-design/icons';

const { Title } = Typography;

/**
 * Props for the StrategyHeader component
 */
interface StrategyHeaderProps {
  /** The main title to display */
  title: string;
  /** Optional department name to prepend to the title */
  departmentName?: string;
  /** Icon to display in the header */
  icon: React.ReactNode;
  /** CSS class for the icon box styling */
  iconBoxClass?: string;
  /** Whether to show the font size adjustment control */
  showFontSize?: boolean;
  /** Current font size value */
  fontSize?: number;
  /** Callback when font size changes */
  onFontSizeChange?: (size: number) => void;
}

/**
 * StrategyHeader - A reusable header component for strategy detail pages
 * Displays a title with an icon and optional font size controls
 */
const StrategyHeader = memo(function StrategyHeader({
  title,
  departmentName,
  icon,
  iconBoxClass = '',
  showFontSize = false,
  fontSize = 18,
  onFontSizeChange,
}: StrategyHeaderProps) {
  const displayTitle = departmentName ? `${departmentName} - ${title}` : title;

  const fontSizeContent = (
    <div style={{ width: 200 }}>
      <Slider
        min={12}
        max={32}
        value={fontSize}
        onChange={(value) => onFontSizeChange?.(value)}
      />
    </div>
  );

  return (
    <>
      <div className="detail-header">
        <div className="header-left">
          <div className={`header-icon-box ${iconBoxClass}`}>
            {icon}
          </div>
          <div className="header-text">
            <Title level={2} style={{ margin: 0 }}>{displayTitle}</Title>
          </div>
        </div>
        {showFontSize && (
          <div className="header-right">
            <Popover content={fontSizeContent} title="调整字体大小" trigger="click">
              <Button icon={<FontSizeOutlined />}>字体大小</Button>
            </Popover>
          </div>
        )}
      </div>
      <Divider />
    </>
  );
});

export default StrategyHeader;
