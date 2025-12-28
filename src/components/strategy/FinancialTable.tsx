'use client';

import React, { memo } from 'react';
import {
  Typography,
  Input,
  Table,
  Dropdown,
  Menu,
  Spin,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';

const { Title } = Typography;

// 默认财务表格列配置
const defaultFinancialColumns: TableColumn[] = [
  {
    title: '财务指标',
    dataIndex: 'metric',
    key: 'metric',
    fixed: 'left' as const,
    width: 200,
    editable: true,
  },
  {
    title: '2023年 (实际)',
    dataIndex: '2023',
    key: '2023',
    editable: true,
    width: 150,
  },
  {
    title: '2024年 (目标)',
    dataIndex: '2024',
    key: '2024',
    editable: true,
    width: 150,
  }
];

// 默认财务表格数据
const defaultFinancialData: TableDataRow[] = [
  { key: '1', metric: '收入 (Revenue)', '2023': '5,000万', '2024': '8,000万' },
  { key: '2', metric: '边界利润 (CM)', '2023': '1,500万', '2024': '2,800万' },
  { key: '3', metric: '固定成本 (Fixed)', '2023': '800万', '2024': '1,000万' },
  { key: '4', metric: '利润 (Profit)', '2023': '700万', '2024': '1,800万' },
  { key: '5', metric: '应收账款 (AR)', '2023': '1,200万', '2024': '1,500万' },
  { key: '6', metric: '库存 (Inventory)', '2023': '500万', '2024': '600万' },
];

const ResizableTitle = (props: any) => {
  const { onResize, width, onDelete, ...restProps } = props;

  const menu = (
    <Menu>
      <Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={onDelete}>
        删除列
      </Menu.Item>
    </Menu>
  );

  const cellContent = (
    <Dropdown overlay={menu} trigger={['contextMenu']}>
      <div className="header-context-wrapper" style={{ height: '100%' }}>
        {restProps.children}
      </div>
    </Dropdown>
  );

  if (!width) {
    return (
      <th {...restProps}>
        {cellContent}
      </th>
    );
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps}>
        {cellContent}
      </th>
    </Resizable>
  );
};

const ResizableBodyCell = (props: any) => {
  const { record, children, className, onRowResize, height, onDelete, ...restProps } = props;

  const menu = (
    <Menu>
      <Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={onDelete}>
        删除指标
      </Menu.Item>
    </Menu>
  );

  const cellContent = (
    <Dropdown overlay={menu} trigger={['contextMenu']}>
      <div className="body-context-wrapper" style={{ height: '100%', minHeight: '32px' }}>
        {children}
      </div>
    </Dropdown>
  );

  if (onRowResize) {
    return (
      <Resizable
        width={0}
        height={height || 50}
        axis="y"
        handle={
          <span
            className="react-resizable-handle react-resizable-handle-s"
            onClick={(e) => e.stopPropagation()}
            style={{ bottom: 0, left: 0, width: '100%', height: '5px', cursor: 'row-resize', position: 'absolute', zIndex: 10 }}
          />
        }
        onResize={onRowResize}
        draggableOpts={{ enableUserSelectHack: false }}
      >
        <td {...restProps} className={`${className || ''} resizable-row-cell`} style={{ ...restProps.style, height: height, position: 'relative' }}>
          {cellContent}
        </td>
      </Resizable>
    );
  }

  return (
    <td {...restProps} className={className} style={{ ...restProps.style, height: height }}>
      {cellContent}
    </td>
  );
};

/**
 * FinancialTable - A table component for financial metrics and projections
 * Supports editable cells, resizable columns/rows, and auto-save functionality
 */
const FinancialTable: React.FC = memo(function FinancialTable() {
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
    tableType: 'financial',
    defaultColumns: defaultFinancialColumns,
    defaultData: defaultFinancialData,
    debounceMs: 1500,
    onSaveError: (error) => {
      message.error('保存失败: ' + error.message);
    },
  });

  const handleResize = (index: number) => (e: any, { size }: any) => {
    setColumns((prevColumns) => {
      const nextColumns = [...prevColumns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return nextColumns;
    });
  };

  const handleRowResize = (key: string) => (e: any, { size }: any) => {
    setRowHeights(prev => ({
      ...prev,
      [key]: size.height
    }));
  };

  const handleAddYear = (index?: number) => {
    const yearKeys = columns
      .filter(c => c.key !== 'metric' && c.key !== 'action')
      .map(c => parseInt(c.key as string)).filter(n => !isNaN(n));

    const maxYear = Math.max(...yearKeys, 2024);
    const nextYear = maxYear + 1;
    const yearKey = nextYear.toString();

    const newCol: TableColumn = {
      title: `${nextYear}年 (规划)`,
      dataIndex: yearKey,
      key: yearKey,
      editable: true,
      width: 150,
    };

    if (typeof index === 'number') {
      const newCols = [...columns];
      newCols.splice(index + 1, 0, newCol);
      setColumns(newCols);
    } else {
      setColumns([...columns, newCol]);
    }

    setData(data.map(row => ({ ...row, [yearKey]: '' })));
  };

  const handleAddRow = () => {
    const newKey = (Math.max(...data.map(d => parseInt(d.key as string))) + 1).toString();
    const newRow: TableDataRow = {
      key: newKey,
      metric: '新指标',
    };
    columns.forEach(col => {
      if (col.dataIndex !== 'metric' && col.dataIndex !== 'action') {
        newRow[col.dataIndex!] = '';
      }
    });
    setData([...data, newRow]);
  };

  const handleDeleteRow = (key: string) => {
    setData(data.filter(item => item.key !== key));
  };

  const handleDeleteColumn = (colKey: string) => {
    if (colKey === 'metric') return;
    setColumns(columns.filter(col => col.key !== colKey));
  };

  const handleCellChange = (key: string, dataIndex: string, value: string) => {
    setData(prevData =>
      prevData.map(row =>
        row.key === key ? { ...row, [dataIndex]: value } : row
      )
    );
  };

  const handleColumnTitleChange = (colKey: string, newTitle: string) => {
    setColumns(prevCols =>
      prevCols.map(col =>
        col.key === colKey ? { ...col, title: newTitle } : col
      )
    );
  };

  const mergedColumns = columns.map((col, index) => {
    return {
      ...col,
      onHeaderCell: (column: any) => ({
        width: column.width,
        onResize: handleResize(index),
        onDelete: () => handleDeleteColumn(column.key),
      }),
      onCell: (record: TableDataRow) => ({
        record,
        onDelete: () => handleDeleteRow(record.key as string),
        onRowResize: index === 0 ? handleRowResize(record.key as string) : undefined,
        height: rowHeights[record.key as string],
      } as any),
      title: (
        <div className="header-cell-hover-target" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Input.TextArea
            defaultValue={typeof col.title === 'string' ? col.title : ''}
            value={typeof col.title === 'string' ? col.title : ''}
            onChange={(e) => handleColumnTitleChange(col.key, e.target.value)}
            bordered={false}
            autoSize
            style={{
              fontWeight: 'bold',
              textAlign: col.key === 'metric' ? 'left' : 'center',
              padding: 0,
              background: 'transparent',
              resize: 'none'
            }}
          />
          {col.key !== 'metric' && (
            <div
              className="add-column-trigger"
              onClick={(e) => {
                e.stopPropagation();
                handleAddYear(index);
              }}
            >
              <div className="add-icon"><PlusOutlined /></div>
            </div>
          )}
        </div>
      ),
      render: (text: string, record: TableDataRow) => (
        <div className="body-cell-hover-target" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input.TextArea
            autoSize
            value={text}
            onChange={(e) => handleCellChange(record.key as string, col.dataIndex!, e.target.value)}
            bordered={false}
            style={{
              textAlign: col.key === 'metric' ? 'left' : 'right',
              fontWeight: col.key === 'metric' ? 'bold' : 'normal',
              padding: '4px 0',
              resize: 'none',
              minHeight: '32px'
            }}
          />
        </div>
      ),
    };
  });

  if (isLoading) {
    return (
      <div className="financial-table-wrapper" style={{ position: 'relative', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="加载数据中..." />
      </div>
    );
  }

  return (
    <div className="financial-table-wrapper" style={{ position: 'relative' }}>
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>财务经营目标推演</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSaving && (
            <span style={{ color: '#1890ff', fontSize: 12 }}>
              <LoadingOutlined style={{ marginRight: 4 }} />
              保存中...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span style={{ color: '#52c41a', fontSize: 12 }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} />
              已自动保存
            </span>
          )}
        </div>
      </div>

      <div className="hover-add-column-target" onClick={() => handleAddYear()}>
        <div className="add-col-icon-box"><PlusOutlined /></div>
      </div>

      <Table
        bordered
        components={{
          header: {
            cell: ResizableTitle,
          },
          body: {
            cell: ResizableBodyCell,
          }
        }}
        dataSource={data}
        columns={mergedColumns}
        pagination={false}
        rowClassName={() => 'financial-row'}
        scroll={{ x: 'max-content' }}
      />

      <div className="hover-add-row-target" onClick={handleAddRow}>
        <div className="add-row-btn-content"><PlusOutlined /> 添加指标</div>
      </div>

      <div className="table-notes">
        * 数据单位：人民币 (RMB)； 支持在线编辑年份数据；右键单元格可删除行/列；鼠标悬浮表格右侧/底部可添加。数据自动保存。
      </div>
    </div>
  );
});

export default FinancialTable;
