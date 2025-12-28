'use client';

import React, { useState } from 'react';
import { Button, Table, List, Radio, Space, Spin, type RadioChangeEvent, Input, Typography, Empty } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    CaretRightOutlined,
    PlusOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useStrategyTableData, type TableColumn, type TableDataRow } from '@/hooks/useStrategyTableData';
import { useEditableTable } from '@/hooks/useEditableTable';
import TaskDecomposition, { type StrategyTaskData } from './TaskDecomposition';
import './PerformanceDeduction.scss';

const { TextArea } = Input;
const { Text } = Typography;

// Default Columns for Performance Deduction Table
const DEFAULT_PD_COLUMNS: TableColumn[] = [
    { title: '经营定位', dataIndex: 'positioning', key: 'positioning', width: 150 },
    { title: '细分市场', dataIndex: 'segment', key: 'segment', width: 150 },
    { title: '客户名称', dataIndex: 'customer', key: 'customer', width: 200 },
    { title: '产品组合', dataIndex: 'product', key: 'product', width: 200 },
];

const DEFAULT_PD_DATA: TableDataRow[] = Array.from({ length: 4 }).map((_, idx) => ({
    key: `row-${idx}`,
    positioning: '',
    segment: '',
    customer: '',
    product: '',
}));

type ListType = 'positioning' | 'segment' | 'customer' | 'product';

const LIST_OPTIONS = [
    { label: '经营定位', value: 'positioning' },
    { label: '细分市场', value: 'segment' },
    { label: '客户名称', value: 'customer' },
    { label: '产品组合', value: 'product' },
];

export const PerformanceDeduction: React.FC = () => {
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [midCollapsed, setMidCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);

    // State for Left Panel List Mode and Selection
    const [listType, setListType] = useState<ListType>('positioning');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // 1. Hook for Left Column (Performance Deduction Table)
    const {
        columns: pdColumns,
        setColumns: setPdColumns,
        data: pdData,
        setData: setPdData,
        rowHeights: pdRowHeights,
        setRowHeights: setPdRowHeights,
        isLoading: isPdLoading,
        isSaving: isPdSaving,
        hasPendingChanges: pdHasPendingChanges,
        lastSaved: pdLastSaved,
    } = useStrategyTableData({
        tableType: 'performance_deduction',
        defaultColumns: DEFAULT_PD_COLUMNS,
        defaultData: DEFAULT_PD_DATA,
        debounceMs: 300, // 减少防抖延迟，提高响应速度
    });

    const {
        handleAddColumn,
        handleAddRow,
        buildMergedColumns,
        components,
    } = useEditableTable({
        columns: pdColumns,
        setColumns: setPdColumns,
        data: pdData,
        setData: setPdData,
        rowHeights: pdRowHeights,
        setRowHeights: setPdRowHeights,
        minColumns: 4,
        fontSize: 14,
    });

    const mergedPdColumns = buildMergedColumns();

    // 2. Hook for Middle Column (Growth Strategies)
    // We mock a table where each row corresponds to a 'selectedKey' from the left
    const {
        data: strategyData,
        setData: setStrategyData,
        isSaving: isStrategySaving,
        hasPendingChanges: strategyHasPendingChanges,
        lastSaved: strategyLastSaved,
    } = useStrategyTableData({
        tableType: 'growth_strategies',
        defaultColumns: [
            { title: 'Value Diagnosis', key: 'diagnosis_value', dataIndex: 'diagnosis_value' },
            { title: 'Funnel Diagnosis', key: 'diagnosis_funnel', dataIndex: 'diagnosis_funnel' },
            { title: 'Team Diagnosis', key: 'diagnosis_team', dataIndex: 'diagnosis_team' },
            { title: 'Growth Strategy', key: 'growth_strategy', dataIndex: 'growth_strategy' },
        ],
        defaultData: [],
        debounceMs: 300, // 减少防抖延迟，提高响应速度
    });

    // 3. Hook for Right Column (Task Decomposition)
    const {
        data: taskDecompData,
        setData: setTaskDecompData,
        isSaving: isTaskDecompSaving,
        lastSaved: taskDecompLastSaved,
    } = useStrategyTableData({
        tableType: 'task_decomposition',
        defaultColumns: [
            { title: 'Task Data', key: 'task_data', dataIndex: 'task_data' },
        ],
        defaultData: [],
        debounceMs: 500,
    });

    // Convert task decomposition data to/from storage format
    const getTaskDataMap = (): Record<string, StrategyTaskData> => {
        const row = taskDecompData.find(r => r.key === 'task_data_store');
        if (!row || !row.task_data) return {};
        try {
            return JSON.parse(row.task_data as string);
        } catch {
            return {};
        }
    };

    const handleTaskDataChange = (newData: Record<string, StrategyTaskData>) => {
        setTaskDecompData([{
            key: 'task_data_store',
            task_data: JSON.stringify(newData),
        }]);
    };

    const handleListTypeChange = (e: RadioChangeEvent) => {
        setListType(e.target.value);
        setSelectedKey(null); // Reset selection when type changes
    };

    // Get distinct list items
    const getListItems = () => {
        const items = pdData.map(item => item[listType] as string).filter(i => i && i.trim() !== '');
        return Array.from(new Set(items));
    };

    // Handle Strategy Data Updates
    const updateStrategyData = (field: string, value: string) => {
        if (!selectedKey) return;

        setStrategyData(prev => {
            const existingRowIndex = prev.findIndex(row => row.key === selectedKey);
            if (existingRowIndex >= 0) {
                const newData = [...prev];
                newData[existingRowIndex] = { ...newData[existingRowIndex], [field]: value };
                return newData;
            } else {
                // Create new row
                return [...prev, { key: selectedKey, [field]: value }];
            }
        });
    };

    // Get current strategy data for selected key
    const currentStrategy: TableDataRow = strategyData.find(row => row.key === selectedKey) || { key: 'empty-fallback' };

    const handleStrategyListChange = (index: number, value: string) => {
        const minRows = 5; // Ensure at least 5 rows
        const listRaw = (currentStrategy.growth_strategy as string) || "[]";
        let list: string[] = [];
        try {
            list = JSON.parse(listRaw);
            if (!Array.isArray(list)) throw new Error('Not an array');
        } catch {
            // Fallback for legacy plain text: split by newline
            list = listRaw ? listRaw.split('\n') : [];
        }

        // Ensure we have enough items if the list is short (legacy migration case)
        if (list.length < minRows) {
            const padding = Array(minRows - list.length).fill('');
            list = [...list, ...padding];
        }

        list[index] = value;
        updateStrategyData('growth_strategy', JSON.stringify(list));
    };
    const handleAddStrategyItem = () => {
        const minRows = 5;
        const listRaw = (currentStrategy.growth_strategy as string) || "[]";
        let list: string[] = [];
        try {
            list = JSON.parse(listRaw);
            if (!Array.isArray(list)) throw new Error('Not an array');
        } catch {
            list = listRaw ? listRaw.split('\n') : [];
        }

        // Ensure visual expansion: if list is short, pad it first
        if (list.length < minRows) {
            const padding = Array(minRows - list.length).fill('');
            list = [...list, ...padding];
        }

        list.push('');
        updateStrategyData('growth_strategy', JSON.stringify(list));
    };
    const handleDeleteStrategyItem = (index: number) => {
        const minRows = 5;
        const listRaw = (currentStrategy.growth_strategy as string) || "[]";
        let list: string[] = [];
        try {
            list = JSON.parse(listRaw);
            if (!Array.isArray(list)) throw new Error('Not an array');
        } catch {
            list = listRaw ? listRaw.split('\n') : [];
        }

        // Create new list without the item at index
        list.splice(index, 1);

        // Ensure we maintain minRows after deletion by padding with empty strings
        if (list.length < minRows) {
            const padding = Array(minRows - list.length).fill('');
            list = [...list, ...padding];
        }

        updateStrategyData('growth_strategy', JSON.stringify(list));
    };

    // Helper to safely get the strategy list
    const getStrategyList = (): string[] => {
        const val = currentStrategy.growth_strategy as string;
        const minRows = 5; // Minimum rows to display

        if (!val) return Array(minRows).fill('');

        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                // If less than minRows, pad it
                if (parsed.length < minRows) {
                    return [...parsed, ...Array(minRows - parsed.length).fill('')];
                }
                return parsed;
            }
            // If it's a valid JSON but not array (unlikely), treat as string
            return [String(parsed)];
        } catch {
            // Legacy plain text
            const split = val.split('\n');
            if (split.length < minRows) {
                return [...split, ...Array(minRows - split.length).fill('')];
            }
            return split;
        }
    };

    // Render Left Panel Content
    const renderLeftPanel = () => {
        if (isPdLoading) {
            return (
                <div className="loading-state">
                    <Spin tip="加载数据中..." />
                </div>
            );
        }

        if (!leftCollapsed) {
            // Expanded: Table View
            return (
                <div className="panel-content expanded">
                    <div className="panel-header">
                        <h3>业绩来源分析</h3>
                    <div className="header-actions">
                            {isPdSaving && (
                                <span className="save-status saving">
                                    <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} />
                                    正在保存...
                                </span>
                            )}
                            {!isPdSaving && pdHasPendingChanges && (
                                <span className="save-status saving">
                                    <LoadingOutlined /> 等待保存...
                                </span>
                            )}
                            {!isPdSaving && !pdHasPendingChanges && pdLastSaved && (
                                <span className="save-status saved">
                                    <CheckCircleOutlined /> 已自动保存
                                </span>
                            )}
                            <Button
                                type="text"
                                icon={<MenuFoldOutlined />}
                                onClick={() => setLeftCollapsed(true)}
                                title="收起为清单"
                            />
                        </div>
                    </div>

                    <div className="table-wrapper-inner financial-table-wrapper">
                        <div className="hover-add-column-target" onClick={() => handleAddColumn()}>
                            <div className="add-col-icon-box"><PlusOutlined /></div>
                        </div>

                        <Table
                            components={components}
                            dataSource={pdData}
                            columns={mergedPdColumns}
                            pagination={false}
                            size="middle"
                            bordered
                            rowClassName={(record) => `financial-row ${record.key === selectedKey ? 'selected-row' : ''}`}
                            onRow={(record) => ({
                                onClick: () => setSelectedKey(record.key),
                                style: { cursor: 'pointer' }
                            })}
                            scroll={{ x: 'max-content' }}
                        />

                        <div className="hover-add-row-target" onClick={() => handleAddRow()}>
                            <div className="add-row-btn-content"><PlusOutlined /> 添加行</div>
                        </div>

                        <div className="table-notes">
                            * 支持在线编辑；右键单元格可删除行/列；点击行可关联右侧策略。
                        </div>
                    </div>
                </div>
            );
        } else {
            // Collapsed: List View
            return (
                <div className="panel-content collapsed">
                    <div className="panel-header">
                        <h3>{LIST_OPTIONS.find(o => o.value === listType)?.label}</h3>
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            onClick={() => setLeftCollapsed(false)}
                            title="展开为表格"
                        />
                    </div>

                    <div className="list-controls">
                        <Radio.Group
                            value={listType}
                            onChange={handleListTypeChange}
                            optionType="button"
                            buttonStyle="solid"
                            size="small"
                            className="list-radio-group"
                        >
                            {LIST_OPTIONS.map(opt => (
                                <Radio.Button key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Radio.Button>
                            ))}
                        </Radio.Group>
                    </div>
                    <div className="list-container">
                        <List
                            size="small"
                            bordered={false}
                            dataSource={getListItems()}
                            renderItem={(item) => (
                                <List.Item
                                    className={`clickable-list-item ${selectedKey === item ? 'selected' : ''}`}
                                    onClick={() => setSelectedKey(item)}
                                >
                                    <Space align="start">
                                        <CaretRightOutlined className="list-icon" />
                                        <span className="list-text">{item}</span>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            );
        }
    };

    // Render Middle Panel (Growth Strategy)
    const renderMiddlePanel = () => {
        if (midCollapsed) return null;

        if (!selectedKey) {
            return (
                <div className="empty-selection-state">
                    <Empty description="请在左侧选择一项以制定策略" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            );
        }

        return (
            <div className="strategy-edit-container">
                <div className="strategy-header-bar">
                    <Text strong type="secondary">当前对象: </Text>
                    <Text strong>{selectedKey?.startsWith('row-') ? '选中行 ' + selectedKey.split('-')[1] : selectedKey}</Text>
                    <div className="save-indicator">
                        {isStrategySaving && <span className="saving"><LoadingOutlined /> 正在保存...</span>}
                        {!isStrategySaving && strategyHasPendingChanges && <span className="saving"><LoadingOutlined /> 等待保存...</span>}
                        {!isStrategySaving && !strategyHasPendingChanges && strategyLastSaved && <span className="saved"><CheckCircleOutlined /> 已自动保存</span>}
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-title">增长目标</div>
                    <div className="diagnosis-grid">
                        <div className="diagnosis-item">
                            <label>历史数值</label>
                            <Input
                                placeholder="输入历史数值..."
                                value={(currentStrategy.target_history as string) || ""}
                                onChange={(e) => updateStrategyData('target_history', e.target.value)}
                            />
                        </div>
                        <div className="diagnosis-item">
                            <label>未来预判</label>
                            <Input
                                placeholder="输入未来预判..."
                                value={(currentStrategy.target_prediction as string) || ""}
                                onChange={(e) => updateStrategyData('target_prediction', e.target.value)}
                            />
                        </div>
                        <div className="diagnosis-item">
                            <label>目标值</label>
                            <Input
                                placeholder="输入目标值..."
                                value={(currentStrategy.target_value as string) || ""}
                                onChange={(e) => updateStrategyData('target_value', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-title">卡点诊断</div>
                    <div className="diagnosis-grid">
                        <div className="diagnosis-item">
                            <label>价值卡点</label>
                            <TextArea
                                placeholder="输入价值卡点..."
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                value={(currentStrategy.diagnosis_value as string) || ""}
                                onChange={(e) => updateStrategyData('diagnosis_value', e.target.value)}
                            />
                        </div>
                        <div className="diagnosis-item">
                            <label>漏斗卡点</label>
                            <TextArea
                                placeholder="输入漏斗卡点..."
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                value={(currentStrategy.diagnosis_funnel as string) || ""}
                                onChange={(e) => updateStrategyData('diagnosis_funnel', e.target.value)}
                            />
                        </div>
                        <div className="diagnosis-item">
                            <label>团队卡点</label>
                            <TextArea
                                placeholder="输入团队卡点..."
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                value={(currentStrategy.diagnosis_team as string) || ""}
                                onChange={(e) => updateStrategyData('diagnosis_team', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section flex-grow">
                    <div className="section-title">增长策略</div>
                    <div className="growth-strategy-list">
                        {getStrategyList().map((item, index) => (
                            <div key={index} className="strategy-item-row">
                                <Input
                                    value={item}
                                    onChange={(e) => handleStrategyListChange(index, e.target.value)}
                                    placeholder={`${index + 1}. 输入策略...`}
                                />
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteStrategyItem(index)}
                                    className="delete-btn"
                                    tabIndex={-1}
                                />
                            </div>
                        ))}
                        <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={handleAddStrategyItem}
                            className="add-strategy-btn"
                        >
                            添加策略
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const [leftWidth, setLeftWidth] = useState(600);
    const [middleWidth, setMiddleWidth] = useState(500);
    const isDragging = React.useRef<{ type: 'left' | 'middle'; startX: number; startWidth: number } | null>(null);

    const handleResizeStart = (type: 'left' | 'middle', e: React.MouseEvent) => {
        e.preventDefault();
        const startW = type === 'left' ? leftWidth : middleWidth;
        isDragging.current = { type, startX: e.clientX, startWidth: startW };
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('resizing');
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const { type, startX, startWidth } = isDragging.current;
            const delta = e.clientX - startX;
            if (type === 'left') {
                setLeftWidth(Math.max(320, startWidth + delta));
            } else {
                setMiddleWidth(Math.max(200, startWidth + delta));
            }
        };
        const handleMouseUp = () => {
            isDragging.current = null;
            document.body.style.cursor = '';
            document.body.classList.remove('resizing');
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [leftWidth, middleWidth]);

    return (
        <div className="performance-deduction-layout">
            {/* LEFT COLUMN */}
            <div
                className={`column left-column ${leftCollapsed ? 'collapsed-mode' : 'expanded-mode'}`}
                style={!leftCollapsed ? { width: leftWidth, flex: 'none' } : undefined}
            >
                {renderLeftPanel()}
            </div>

            {/* Resizer 1 */}
            {!leftCollapsed && (
                <div className="resize-handle" onMouseDown={(e) => handleResizeStart('left', e)} />
            )}
            {leftCollapsed && <div className="resize-handle" />}

            {/* MIDDLE COLUMN */}
            <div
                className={`column middle-column ${midCollapsed ? 'collapsed' : ''}`}
                style={!midCollapsed ? { width: middleWidth, flex: 'none' } : undefined}
            >
                <div className="panel-header">
                    <h3>增长策略</h3>
                    <Button
                        type="text"
                        icon={midCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setMidCollapsed(!midCollapsed)}
                    />
                </div>
                {!midCollapsed && renderMiddlePanel()}
            </div>

            {/* RIGHT COLUMN */}
            {/* Resizer 2 */}
            {!midCollapsed && (
                <div className="resize-handle" onMouseDown={(e) => handleResizeStart('middle', e)} />
            )}
            {midCollapsed && <div className="resize-handle" />}

            {/* RIGHT COLUMN */}
            <div className={`column right-column ${rightCollapsed ? 'collapsed' : ''}`}>
                <div className="panel-header">
                    <h3>任务分解</h3>
                    <Button
                        type="text"
                        icon={rightCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setRightCollapsed(!rightCollapsed)}
                    />
                </div>
                {!rightCollapsed && (() => {
                    const currentStrategies = getStrategyList().filter(s => s && s.trim() !== '');
                    const allTaskData = getTaskDataMap();
                    // 过滤任务数据，只保留当前增长策略列表中存在的策略
                    const filteredTaskData: Record<string, StrategyTaskData> = {};
                    currentStrategies.forEach(strategy => {
                        if (allTaskData[strategy]) {
                            filteredTaskData[strategy] = allTaskData[strategy];
                        }
                    });
                    return (
                        <TaskDecomposition
                            strategies={currentStrategies}
                            taskData={filteredTaskData}
                            onTaskDataChange={handleTaskDataChange}
                            isSaving={isTaskDecompSaving}
                            lastSaved={taskDecompLastSaved}
                        />
                    );
                })()}
            </div>
        </div>
    );
};

export default PerformanceDeduction;
