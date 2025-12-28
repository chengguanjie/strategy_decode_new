import React, { memo } from 'react';
import { Tabs, Card, Spin, Table } from 'antd';
import { PlusOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useStrategyTableData, TableColumn, TableDataRow } from '@/hooks/useStrategyTableData';
import { useEditableTable } from '@/hooks/useEditableTable';
import './StrategyDetail.scss';
import './MarketSelectionTable.scss';

/**
 * Props for the CustomerStructureTabs component
 */
interface CustomerStructureTabsProps {
  /** Font size for table content */
  fontSize?: number;
  /** Optional department ID for filtering data */
  departmentId?: string;
}

interface GenericTableProps {
  tableType: string;
  departmentId?: string;
  initialColumns: TableColumn[];
  initialData: TableDataRow[];
  fontSize: number;
  title: string;
}

const GenericTable: React.FC<GenericTableProps> = ({ tableType, departmentId, initialColumns, initialData, fontSize, title }) => {
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
    tableType,
    departmentId,
    defaultColumns: initialColumns,
    defaultData: initialData,
    debounceMs: 1000,
    apiEndpoint: '/api/enterprise/customer-structure',
    onSaveError: (error) => {
      // Error is already handled with simplified message in the hook using new logic
      console.error('Customer structure save error:', error);
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
      <Card bordered={false} className="market-selection-card" styles={{ body: { padding: 24 } }}>
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
          <span style={{ fontSize: '16px' }}>{title}</span>
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
};

const PORTRAIT_COLUMNS: TableColumn[] = [
  { title: '维度', dataIndex: 'dimension', key: 'dimension', width: 200, fixed: 'left' },
  { title: '描述', dataIndex: 'description', key: 'description', width: 400 },
];

const PORTRAIT_DATA: TableDataRow[] = [
  { key: 'row-1', dimension: '北极星客户标准', description: '' },
  { key: 'row-2', dimension: '能力维度', description: '' },
  { key: 'row-3', dimension: '意愿维度', description: '' },
];

const INVENTORY_COLUMNS: TableColumn[] = [
  { title: '客户名称', dataIndex: 'customer_name', key: 'customer_name', width: 200, fixed: 'left' },
  { title: '去年采购额', dataIndex: 'last_year_purchase', key: 'last_year_purchase', width: 150 },
  { title: '钱包份额', dataIndex: 'wallet_share', key: 'wallet_share', width: 150 },
  { title: '增长点', dataIndex: 'growth_point', key: 'growth_point', width: 200 },
  { title: '增长策略', dataIndex: 'growth_strategy', key: 'growth_strategy', width: 200 },
];

const INVENTORY_DATA: TableDataRow[] = Array.from({ length: 5 }).map((_, idx) => ({
  key: `row-${idx}`,
  customer_name: '',
  last_year_purchase: '',
  wallet_share: '',
  growth_point: '',
  growth_strategy: '',
}));

const PORTFOLIO_COLUMNS: TableColumn[] = [
  { title: '区域', dataIndex: 'region', key: 'region', width: 120, fixed: 'left' },
  { title: '区隔市场', dataIndex: 'segment_market', key: 'segment_market', width: 120 },
  { title: '标杆客户-已有', dataIndex: 'benchmark_existing', key: 'benchmark_existing', width: 120 },
  { title: '标杆客户-潜在', dataIndex: 'benchmark_potential', key: 'benchmark_potential', width: 120 },
  { title: '利润客户-已有', dataIndex: 'profit_existing', key: 'profit_existing', width: 120 },
  { title: '利润客户-潜在', dataIndex: 'profit_potential', key: 'profit_potential', width: 150 },
  { title: '培育客户', dataIndex: 'nurture_customer', key: 'nurture_customer', width: 150 },
  { title: '组合策略', dataIndex: 'portfolio_strategy', key: 'portfolio_strategy', width: 200 },
];

const PORTFOLIO_DATA: TableDataRow[] = Array.from({ length: 5 }).map((_, idx) => ({
  key: `row-${idx}`,
  region: '',
  segment_market: '',
  benchmark_existing: '',
  benchmark_potential: '',
  profit_existing: '',
  profit_potential: '',
  nurture_customer: '',
  portfolio_strategy: '',
}));

/**
 * CustomerStructureTabs - A tabbed component for customer structure analysis
 * Contains multiple tables for customer portrait, inventory, and portfolio planning
 */
const CustomerStructureTabs: React.FC<CustomerStructureTabsProps> = memo(function CustomerStructureTabs({ fontSize = 14, departmentId }) {
  const tabItems = [
    {
      key: '1',
      label: '北极星客户画像',
      children: (
        <GenericTable
          tableType="customer_portrait"
          departmentId={departmentId}
          initialColumns={PORTRAIT_COLUMNS}
          initialData={PORTRAIT_DATA}
          fontSize={fontSize}
          title="北极星客户画像"
        />
      ),
    },
    {
      key: '2',
      label: '北极星客户盘点',
      children: (
        <GenericTable
          tableType="customer_inventory"
          departmentId={departmentId}
          initialColumns={INVENTORY_COLUMNS}
          initialData={INVENTORY_DATA}
          fontSize={fontSize}
          title="北极星客户盘点"
        />
      ),
    },
    {
      key: '3',
      label: '客户组合规划',
      children: (
        <GenericTable
          tableType="customer_portfolio"
          departmentId={departmentId}
          initialColumns={PORTFOLIO_COLUMNS}
          initialData={PORTFOLIO_DATA}
          fontSize={fontSize}
          title="客户组合规划"
        />
      ),
    },
  ];

  return (
    <Tabs defaultActiveKey="1" items={tabItems} />
  );
});

export default CustomerStructureTabs;
