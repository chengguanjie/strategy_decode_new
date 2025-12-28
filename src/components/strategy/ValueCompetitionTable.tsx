import React, { useState, memo } from 'react';
import { Card, Table, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';
import { useEditableTable, EditableInput } from '@/hooks/useEditableTable';
import './StrategyDetail.scss';
import './MarketSelectionTable.scss';

const DEFAULT_COLUMNS: TableColumn[] = [
  { title: '客户类型', dataIndex: 'customer_type', key: 'customer_type', width: 120 },
  { title: '价值维度', dataIndex: 'dimension', key: 'dimension', width: 120 },
  { title: '企业1', dataIndex: 'enterprise1', key: 'enterprise1', width: 150 },
  { title: '企业2', dataIndex: 'enterprise2', key: 'enterprise2', width: 150 },
  { title: '竞争策略', dataIndex: 'strategy', key: 'strategy', width: 200 },
  { title: '部门要求', dataIndex: 'department', key: 'department', width: 200 },
];

const DEFAULT_DATA: TableDataRow[] = [
  { key: 'row-0', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-1', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-2', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-3', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-4', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-5', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-6', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-7', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
  { key: 'row-8', customer_type: '', dimension: '', enterprise1: '', enterprise2: '', strategy: '', department: '', rowSpan: 1 },
];

/**
 * Props for the ValueCompetitionTable component
 */
interface ValueCompetitionTableProps {
  /** Font size for table content */
  fontSize?: number;
}

/**
 * ValueCompetitionTable - A table component for value competition analysis
 * Supports editable cells, resizable columns/rows, row spanning, and auto-save functionality
 */
const ValueCompetitionTable: React.FC<ValueCompetitionTableProps> = memo(function ValueCompetitionTable({ fontSize = 14 }) {
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
    tableType: 'value',
    defaultColumns: DEFAULT_COLUMNS,
    defaultData: DEFAULT_DATA,
    debounceMs: 1000,
    apiEndpoint: '/api/enterprise/strategy-table',
    onSaveError: (error) => {
      // Error handling is simplified in the hook now
      console.error('Value competition save error:', error);
    },
  });

  const [coreStrategy, setCoreStrategy] = useState('');

  const {
    handleAddColumn,
    handleAddRow,
    handleColumnResize,
    handleRowResize,
    handleDeleteRow,
    handleDeleteColumn,
    handleCellChange,
    createHeaderTitle,
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

  // Custom merged columns with rowSpan support for dimension column
  const mergedColumns = columns.map((col, index) => {
    const isDimensionCol = col.dataIndex === 'dimension';
    const isFirstCol = index === 0;

    return {
      ...col,
      onHeaderCell: (column: any) => ({
        width: column.width,
        onResize: handleColumnResize(index),
        onDelete: () => handleDeleteColumn(column.key),
      }),
      onCell: (record: TableDataRow) => {
        const cellProps: any = {
          record,
          onDelete: () => handleDeleteRow(record.key as string),
          onRowResize: isFirstCol ? handleRowResize(record.key as string) : undefined,
          height: rowHeights[record.key as string],
        };

        if (isDimensionCol) {
          if (record.rowSpan === 0) {
            cellProps.rowSpan = 0;
          } else if (typeof record.rowSpan === 'number' && record.rowSpan > 1) {
            cellProps.rowSpan = record.rowSpan;
          }
        }

        return cellProps;
      },
      title: createHeaderTitle(col, index, isFirstCol),
      render: (text: any, record: TableDataRow) => {
        if (isDimensionCol && record.rowSpan === 0) {
          return null;
        }

        return (
          <div className="body-cell-hover-target" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditableInput
              autoSize
              value={String(text || '')}
              onChange={(value) => handleCellChange(record.key as string, col.dataIndex!, value)}
              style={{
                textAlign: isFirstCol || isDimensionCol ? 'left' : 'center',
                fontWeight: isFirstCol || isDimensionCol ? 'bold' : 'normal',
                padding: '4px 0',
                resize: 'none',
                minHeight: '32px',
                fontSize: fontSize
              }}
            />
          </div>
        );
      },
    };
  });

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
          <span style={{ fontSize: '16px' }}>价值竞争分析</span>
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

        <div className="hover-add-row-target" onClick={() => handleAddRow({ rowSpan: '1' })}>
          <div className="add-row-btn-content"><PlusOutlined /> 添加行</div>
        </div>

        <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', borderLeft: '4px solid #faad14' }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: fontSize }}>核心竞争策略：</div>
          <EditableInput
            value={coreStrategy}
            onChange={(value) => setCoreStrategy(value)}
            // placeholder prop is not supported by EditableInput, removing it or we need to add it to EditableInput props.
            // Since EditableInput wraps Input.TextArea, I should check if I passed restProps. 
            // I checked useEditableTable.tsx, I did NOT pass rest props to Input.TextArea.
            // So placeholder won't work unless I update EditableInput. 
            // For now I will omit placeholder or update EditableInput later if critical. Use basic input for now.
            autoSize={{ minRows: 2 }}
            style={{ background: 'transparent', fontSize: fontSize }}
          />
        </div>

        <div className="table-notes" style={{ marginTop: 8 }}>
          * 支持在线编辑；右键单元格可删除行/列；鼠标悬浮表格右侧/底部可添加行列。数据自动保存。
        </div>
      </div>
    </Card>
  );
});

export default ValueCompetitionTable;
