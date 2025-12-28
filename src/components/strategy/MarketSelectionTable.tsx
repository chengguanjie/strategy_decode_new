import React, { memo } from 'react';
import { Card, Table, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';
import { useEditableTable } from '@/hooks/useEditableTable';
import './StrategyDetail.scss';
import './MarketSelectionTable.scss';

/**
 * Props for the MarketSelectionTable component
 */
interface MarketSelectionTableProps {
  /** Font size for table content */
  fontSize?: number;
}

const DEFAULT_COLUMNS: TableColumn[] = [
  { title: '业务类型', dataIndex: 'business_type', key: 'business_type', width: 200, fixed: 'left' as const },
  { title: '细分市场', dataIndex: 'market_segment', key: 'market_segment', width: 200, fixed: 'left' as const },
  { title: '经营定位', dataIndex: 'core_positioning', key: 'core_positioning', width: 200 },
  { title: '增长点', dataIndex: 'growth_point', key: 'growth_point', width: 200 },
  { title: '内部要求', dataIndex: 'internal_requirement', key: 'internal_requirement', width: 200 },
];

const DEFAULT_DATA: TableDataRow[] = Array.from({ length: 5 }).map((_, idx) => ({
  key: `row-${idx}`,
  business_type: '',
  market_segment: '',
  core_positioning: '',
  growth_point: '',
  internal_requirement: '',
}));

/**
 * MarketSelectionTable - A table component for market segmentation analysis
 * Supports editable cells, resizable columns/rows, and auto-save functionality
 */
const MarketSelectionTable: React.FC<MarketSelectionTableProps> = memo(function MarketSelectionTable({ fontSize = 14 }) {
  const {
    columns,
    setColumns,
    data,
    setData,
    rowHeights,
    setRowHeights,
    isLoading,
    isSaving,
    lastSaved,
  } = useStrategyTableData({
    tableType: 'market',
    defaultColumns: DEFAULT_COLUMNS,
    defaultData: DEFAULT_DATA,
    debounceMs: 1000,
    apiEndpoint: '/api/enterprise/strategy-table',
    onSaveError: (error) => {
      // Error handling is simplified in the hook now
      console.error('Market selection save error:', error);
    },
  });

  const {
    handleAddColumn,
    handleAddRow,
    buildMergedColumns,
    components,
  } = useEditableTable({
    columns,
    setColumns,
    data,
    setData,
    rowHeights,
    setRowHeights,
    fontSize,
    minColumns: 1,
    minRows: 1,
  });

  const mergedColumns = buildMergedColumns();

  if (isLoading) {
    return (
      <Card
        bordered={false}
        className="market-selection-card"
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Spin size="large" />
          <span style={{ color: '#999' }}>加载数据中...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>市场细分矩阵 (Market Segmentation Matrix)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSaving && (
              <span style={{ color: '#1890ff', fontSize: 12, fontWeight: 'normal', display: 'flex', alignItems: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} style={{ marginRight: 6 }} />
                保存中...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span style={{ color: '#52c41a', fontSize: 12, fontWeight: 'normal' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                已自动保存
              </span>
            )}
          </div>
        </div>
      }
      bordered={false}
      className="market-selection-card"
      styles={{ body: { padding: 0 } }}
    >
      <div className="financial-table-wrapper" style={{ padding: '24px', position: 'relative' }}>
        <div className="hover-add-column-target" onClick={() => handleAddColumn()}>
          <div className="add-col-icon-box"><PlusOutlined /></div>
        </div>

        <Table
          bordered
          components={components as any}
          dataSource={data}
          columns={mergedColumns}
          pagination={false}
          rowClassName={() => 'financial-row'}
          scroll={{ x: 'max-content' }}
        />

        <div className="hover-add-row-target" onClick={() => handleAddRow()}>
          <div className="add-row-btn-content"><PlusOutlined /> 添加行</div>
        </div>

        <div className="table-notes" style={{ marginTop: 8 }}>
          * 支持在线编辑；右键单元格可删除行/列；鼠标悬浮表格右侧/底部可添加行列。数据自动保存。
        </div>
      </div>
    </Card>
  );
});

export default MarketSelectionTable;
