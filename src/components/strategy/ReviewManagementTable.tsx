import React, { memo } from 'react';
import { Input, Card, Table, Dropdown, Menu, Spin, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';
import './StrategyDetail.scss';
import './MarketSelectionTable.scss';

/**
 * Props for the ReviewManagementTable component
 */
interface ReviewManagementTableProps {
  /** Font size for table content */
  fontSize?: number;
}

const ResizableTitle = (props: any) => {
  const { onResize, width, onDelete, ...restProps } = props;
  const menu = (<Menu><Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={onDelete}>删除列</Menu.Item></Menu>);
  const cellContent = (<Dropdown overlay={menu} trigger={['contextMenu']}><div className="header-context-wrapper" style={{ height: '100%' }}>{restProps.children}</div></Dropdown>);
  if (!width) return <th {...restProps}>{cellContent}</th>;
  return (
    <Resizable width={width} height={0} handle={<span className="react-resizable-handle" onClick={(e) => e.stopPropagation()} />} onResize={onResize} draggableOpts={{ enableUserSelectHack: false }}>
      <th {...restProps}>{cellContent}</th>
    </Resizable>
  );
};

const ResizableBodyCell = (props: any) => {
  const { record, children, className, onRowResize, height, onDelete, ...restProps } = props;
  const menu = (<Menu><Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={onDelete}>删除行</Menu.Item></Menu>);
  const cellContent = (<Dropdown overlay={menu} trigger={['contextMenu']}><div className="body-context-wrapper" style={{ height: '100%', minHeight: '32px' }}>{children}</div></Dropdown>);
  if (onRowResize) {
    return (
      <Resizable width={0} height={height || 50} axis="y" handle={<span className="react-resizable-handle react-resizable-handle-s" onClick={(e) => e.stopPropagation()} style={{ bottom: 0, left: 0, width: '100%', height: '5px', cursor: 'row-resize', position: 'absolute', zIndex: 10 }} />} onResize={onRowResize} draggableOpts={{ enableUserSelectHack: false }}>
        <td {...restProps} className={`${className || ''} resizable-row-cell`} style={{ ...restProps.style, height, position: 'relative' }}>{cellContent}</td>
      </Resizable>
    );
  }
  return <td {...restProps} className={className} style={{ ...restProps.style, height }}>{cellContent}</td>;
};

const DEFAULT_COLUMNS: TableColumn[] = [
  { title: '管理维度', dataIndex: 'dimension', key: 'dimension', width: 150, fixed: 'left' as const },
  { title: '主要内容', dataIndex: 'main_content', key: 'main_content', width: 200 },
  { title: '核心问题', dataIndex: 'core_issue', key: 'core_issue', width: 150 },
  { title: '关键原因', dataIndex: 'key_reason', key: 'key_reason', width: 150 },
  { title: '解决对策', dataIndex: 'solution', key: 'solution', width: 150 },
  { title: 'AI赋能点', dataIndex: 'ai_enablement', key: 'ai_enablement', width: 150 },
];

const DEFAULT_DATA: TableDataRow[] = [
  { key: 'row-0', dimension: '数据分析', main_content: '', core_issue: '', key_reason: '', solution: '', ai_enablement: '' },
  { key: 'row-1', dimension: '复盘会议', main_content: '', core_issue: '', key_reason: '', solution: '', ai_enablement: '' },
  { key: 'row-2', dimension: '绩效辅导', main_content: '', core_issue: '', key_reason: '', solution: '', ai_enablement: '' },
];


/**
 * ReviewManagementTable - A table component for review management matrix
 * Supports editable cells, resizable columns/rows, and auto-save functionality
 */
const ReviewManagementTable: React.FC<ReviewManagementTableProps> = memo(function ReviewManagementTable({ fontSize = 14 }) {
  const { columns, setColumns, data, setData, rowHeights, setRowHeights, isLoading, isSaving, lastSaved } = useStrategyTableData({
    tableType: 'review',
    defaultColumns: DEFAULT_COLUMNS,
    defaultData: DEFAULT_DATA,
    debounceMs: 1500,
    onSaveError: (error) => { message.error('保存失败: ' + error.message); },
  });

  const handleResize = (index: number) => (e: any, { size }: any) => { setColumns((prev) => { const next = [...prev]; next[index] = { ...next[index], width: size.width }; return next; }); };
  const handleRowResize = (key: string) => (e: any, { size }: any) => { setRowHeights(prev => ({ ...prev, [key]: size.height })); };
  const handleAddColumn = (index?: number) => {
    const newColId = `col-${Date.now()}`;
    const newCol: TableColumn = { title: '新列', dataIndex: newColId, key: newColId, width: 150 };
    if (typeof index === 'number') { const newCols = [...columns]; newCols.splice(index + 1, 0, newCol); setColumns(newCols); }
    else { setColumns([...columns, newCol]); }
    setData(data.map(row => ({ ...row, [newColId]: '' })));
  };
  const handleAddRow = () => {
    const newKey = `row-${Date.now()}`;
    const newRow: TableDataRow = { key: newKey };
    columns.forEach(col => { newRow[col.dataIndex!] = ''; });
    setData([...data, newRow]);
  };
  const handleDeleteRow = (key: string) => { if (data.length <= 1) return; setData(data.filter(item => item.key !== key)); };
  const handleDeleteColumn = (colKey: string) => { if (columns.length <= 1) return; setColumns(columns.filter(col => col.key !== colKey)); };
  const handleCellChange = (key: string, dataIndex: string, value: string) => { setData(prev => prev.map(row => row.key === key ? { ...row, [dataIndex]: value } : row)); };
  const handleColumnTitleChange = (colKey: string, newTitle: string) => { setColumns(prev => prev.map(col => col.key === colKey ? { ...col, title: newTitle } : col)); };

  const mergedColumns = columns.map((col, index) => {
    const isFirstCol = index === 0;
    return {
      ...col,
      onHeaderCell: (column: any) => ({ width: column.width, onResize: handleResize(index), onDelete: () => handleDeleteColumn(column.key) }),
      onCell: (record: TableDataRow) => ({ record, onDelete: () => handleDeleteRow(record.key as string), onRowResize: isFirstCol ? handleRowResize(record.key as string) : undefined, height: rowHeights[record.key as string] } as any),
      title: (
        <div className="header-cell-hover-target" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Input.TextArea value={typeof col.title === 'string' ? col.title : ''} onChange={(e) => handleColumnTitleChange(col.key, e.target.value)} bordered={false} autoSize style={{ fontWeight: 'bold', textAlign: isFirstCol ? 'left' : 'center', padding: 0, background: 'transparent', resize: 'none', fontSize }} />
          <div className="add-column-trigger" onClick={(e) => { e.stopPropagation(); handleAddColumn(index); }}><div className="add-icon"><PlusOutlined /></div></div>
        </div>
      ),
      render: (text: string, record: TableDataRow) => (
        <div className="body-cell-hover-target" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input.TextArea autoSize value={text} onChange={(e) => handleCellChange(record.key as string, col.dataIndex!, e.target.value)} bordered={false} style={{ textAlign: 'left', fontWeight: isFirstCol ? 'bold' : 'normal', padding: '4px 0', resize: 'none', minHeight: '32px', fontSize }} />
        </div>
      ),
    };
  });

  if (isLoading) {
    return (
      <Card title={<span style={{ fontSize: '16px' }}>复盘管理矩阵 (Review Management Matrix)</span>} bordered={false} className="market-selection-card" styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '24px', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="加载数据中..." /></div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>复盘管理矩阵 (Review Management Matrix)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSaving && <span style={{ color: '#1890ff', fontSize: 12, fontWeight: 'normal' }}><LoadingOutlined style={{ marginRight: 4 }} />保存中...</span>}
            {!isSaving && lastSaved && <span style={{ color: '#52c41a', fontSize: 12, fontWeight: 'normal' }}><CheckCircleOutlined style={{ marginRight: 4 }} />已自动保存</span>}
          </div>
        </div>
      }
      bordered={false} className="market-selection-card" styles={{ body: { padding: 0 } }}
    >
      <div className="financial-table-wrapper" style={{ padding: '24px', position: 'relative' }}>
        <div className="hover-add-column-target" onClick={() => handleAddColumn()}><div className="add-col-icon-box"><PlusOutlined /></div></div>
        <Table bordered components={{ header: { cell: ResizableTitle }, body: { cell: ResizableBodyCell } }} dataSource={data} columns={mergedColumns} pagination={false} rowClassName={() => 'financial-row'} scroll={{ x: 'max-content' }} />
        <div className="hover-add-row-target" onClick={handleAddRow}><div className="add-row-btn-content"><PlusOutlined /> 添加行</div></div>
        <div className="table-notes" style={{ marginTop: 8 }}>* 支持在线编辑；右键单元格可删除行/列；鼠标悬浮表格右侧/底部可添加行列。数据自动保存。</div>
      </div>
    </Card>
  );
});

export default ReviewManagementTable;
