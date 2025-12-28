import React, { memo } from 'react';
import { Input, Card, Table, Dropdown, Menu, Spin, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';
import './StrategyDetail.scss';
import './MarketSelectionTable.scss';

/**
 * Props for the DepartmentStrategyTable component
 */
interface DepartmentStrategyTableProps {
  /** Font size for table content */
  fontSize?: number;
}

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
    return <th {...restProps}>{cellContent}</th>;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={<span className="react-resizable-handle" onClick={(e) => e.stopPropagation()} />}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps}>{cellContent}</th>
    </Resizable>
  );
};

const ResizableBodyCell = (props: any) => {
  const { record, children, className, onRowResize, height, onDelete, ...restProps } = props;

  const menu = (
    <Menu>
      <Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={onDelete}>
        删除行
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

const DEFAULT_COLUMNS: TableColumn[] = [
  { title: '战略目标', dataIndex: 'strategic_goal', key: 'strategic_goal', width: 200, fixed: 'left' as const },
  { title: '部门承接点', dataIndex: 'department_connection', key: 'department_connection', width: 200 },
  { title: '部门指标', dataIndex: 'department_goal', key: 'department_goal', width: 200 },
  { title: '差距分析', dataIndex: 'gap_analysis', key: 'gap_analysis', width: 200 },
  { title: '卡点分析', dataIndex: 'bottleneck_analysis', key: 'bottleneck_analysis', width: 200 },
  { title: '核心对策', dataIndex: 'core_solution', key: 'core_solution', width: 200 },
];

const DEFAULT_DATA: TableDataRow[] = Array.from({ length: 5 }).map((_, idx) => ({
  key: `row-${idx}`,
  strategic_goal: '',
  department_connection: '',
  department_goal: '',
  gap_analysis: '',
  bottleneck_analysis: '',
  core_solution: '',
}));


/**
 * DepartmentStrategyTable - A table component for department strategy alignment
 * Supports editable cells, resizable columns/rows, and auto-save functionality
 */
const DepartmentStrategyTable: React.FC<DepartmentStrategyTableProps> = memo(function DepartmentStrategyTable({ fontSize = 14 }) {
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
    tableType: 'department_strategy',
    defaultColumns: DEFAULT_COLUMNS,
    defaultData: DEFAULT_DATA,
    debounceMs: 1500,
    onSaveError: (error) => {
      message.error('保存失败: ' + error.message);
    },
  });

  const handleResize = (index: number) => (e: any, { size }: any) => {
    setColumns((prevColumns) => {
      const nextColumns = [...prevColumns];
      nextColumns[index] = { ...nextColumns[index], width: size.width };
      return nextColumns;
    });
  };

  const handleRowResize = (key: string) => (e: any, { size }: any) => {
    setRowHeights(prev => ({ ...prev, [key]: size.height }));
  };

  const handleAddColumn = (index?: number) => {
    const newColId = `col-${Date.now()}`;
    const newCol: TableColumn = { title: '新列', dataIndex: newColId, key: newColId, width: 200 };

    if (typeof index === 'number') {
      const newCols = [...columns];
      newCols.splice(index + 1, 0, newCol);
      setColumns(newCols);
    } else {
      setColumns([...columns, newCol]);
    }
    setData(data.map(row => ({ ...row, [newColId]: '' })));
  };

  const handleAddRow = () => {
    const newKey = `row-${Date.now()}`;
    const newRow: TableDataRow = { key: newKey };
    columns.forEach(col => { newRow[col.dataIndex!] = ''; });
    setData([...data, newRow]);
  };

  const handleDeleteRow = (key: string) => {
    if (data.length <= 1) return;
    setData(data.filter(item => item.key !== key));
  };

  const handleDeleteColumn = (colKey: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter(col => col.key !== colKey));
  };

  const handleCellChange = (key: string, dataIndex: string, value: string) => {
    setData(prevData => prevData.map(row => row.key === key ? { ...row, [dataIndex]: value } : row));
  };

  const handleColumnTitleChange = (colKey: string, newTitle: string) => {
    setColumns(prevCols => prevCols.map(col => col.key === colKey ? { ...col, title: newTitle } : col));
  };

  const mergedColumns = columns.map((col, index) => {
    const isFirstCol = index === 0;
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
        onRowResize: isFirstCol ? handleRowResize(record.key as string) : undefined,
        height: rowHeights[record.key as string],
      } as any),
      title: (
        <div className="header-cell-hover-target" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Input.TextArea
            value={typeof col.title === 'string' ? col.title : ''}
            onChange={(e) => handleColumnTitleChange(col.key, e.target.value)}
            bordered={false}
            autoSize
            style={{ fontWeight: 'bold', textAlign: isFirstCol ? 'left' : 'center', padding: 0, background: 'transparent', resize: 'none', fontSize }}
          />
          <div className="add-column-trigger" onClick={(e) => { e.stopPropagation(); handleAddColumn(index); }}>
            <div className="add-icon"><PlusOutlined /></div>
          </div>
        </div>
      ),
      render: (text: string, record: TableDataRow) => (
        <div className="body-cell-hover-target" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input.TextArea
            autoSize
            value={text}
            onChange={(e) => handleCellChange(record.key as string, col.dataIndex!, e.target.value)}
            bordered={false}
            style={{ textAlign: 'left', fontWeight: isFirstCol ? 'bold' : 'normal', padding: '4px 0', resize: 'none', minHeight: '32px', fontSize }}
          />
        </div>
      ),
    };
  });

  if (isLoading) {
    return (
      <Card title={<span style={{ fontSize: '16px' }}>部门战略承接表 (Department Strategy Alignment)</span>} bordered={false} className="market-selection-card" styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '24px', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="加载数据中..." />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>部门战略承接表 (Department Strategy Alignment)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSaving && <span style={{ color: '#1890ff', fontSize: 12, fontWeight: 'normal' }}><LoadingOutlined style={{ marginRight: 4 }} />保存中...</span>}
            {!isSaving && lastSaved && <span style={{ color: '#52c41a', fontSize: 12, fontWeight: 'normal' }}><CheckCircleOutlined style={{ marginRight: 4 }} />已自动保存</span>}
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
          components={{ header: { cell: ResizableTitle }, body: { cell: ResizableBodyCell } }}
          dataSource={data}
          columns={mergedColumns}
          pagination={false}
          rowClassName={() => 'financial-row'}
          scroll={{ x: 'max-content' }}
        />
        <div className="hover-add-row-target" onClick={handleAddRow}>
          <div className="add-row-btn-content"><PlusOutlined /> 添加行</div>
        </div>
        <div className="table-notes" style={{ marginTop: 8 }}>
          * 支持在线编辑；右键单元格可删除行/列；鼠标悬浮表格右侧/底部可添加行列。数据自动保存。
        </div>
      </div>
    </Card>
  );
});

export default DepartmentStrategyTable;
