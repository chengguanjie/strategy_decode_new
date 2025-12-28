'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Collapse, Empty, Spin, Table, Input, Button, Select, message, Tooltip } from 'antd';
import {
  CaretRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import GanttChart, { type GanttTask } from './GanttChart';
import './TaskDecomposition.scss';

const { Panel } = Collapse;

interface Department {
  id: string;
  name: string;
}

interface DepartmentTask {
  id: string;
  departmentId: string;
  departmentName: string;
  taskName: string;
  description: string;
  owner: string;
  deadline: string;
}

export interface StrategyTaskData {
  strategyName: string;
  ganttTasks: GanttTask[];
  departmentTasks: DepartmentTask[];
}

interface TaskDecompositionProps {
  strategies: string[];  // List of strategy names from growth strategy
  taskData: Record<string, StrategyTaskData>;  // Strategy name -> task data mapping
  onTaskDataChange?: (data: Record<string, StrategyTaskData>) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export const TaskDecomposition: React.FC<TaskDecompositionProps> = ({
  strategies,
  taskData,
  onTaskDataChange,
  isSaving = false,
  lastSaved = null,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/enterprise/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        const deptList = result.data || result;
        setDepartments(Array.isArray(deptList) ? deptList : []);
      }
    } catch (e) {
      console.error('Failed to fetch departments:', e);
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Initialize task data for a strategy if not exists
  const getOrCreateTaskData = (strategyName: string): StrategyTaskData => {
    return taskData[strategyName] || {
      strategyName,
      ganttTasks: [],
      departmentTasks: [],
    };
  };

  // Handle gantt tasks change
  const handleGanttTasksChange = (strategyName: string, ganttTasks: GanttTask[]) => {
    const currentData = getOrCreateTaskData(strategyName);
    const newTaskData = {
      ...taskData,
      [strategyName]: {
        ...currentData,
        ganttTasks,
      },
    };
    onTaskDataChange?.(newTaskData);
  };

  // Handle department task change
  const handleDeptTaskChange = (
    strategyName: string,
    taskId: string,
    field: keyof DepartmentTask,
    value: string
  ) => {
    const currentData = getOrCreateTaskData(strategyName);
    const newDeptTasks = currentData.departmentTasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            [field]: value,
            ...(field === 'departmentId' ? { departmentName: departments.find(d => d.id === value)?.name || '' } : {}),
          }
        : task
    );

    const newTaskData = {
      ...taskData,
      [strategyName]: {
        ...currentData,
        departmentTasks: newDeptTasks,
      },
    };
    onTaskDataChange?.(newTaskData);
  };

  // Add new department task
  const handleAddDeptTask = (strategyName: string) => {
    const currentData = getOrCreateTaskData(strategyName);
    const newTask: DepartmentTask = {
      id: `dept-task-${Date.now()}`,
      departmentId: '',
      departmentName: '',
      taskName: '',
      description: '',
      owner: '',
      deadline: '',
    };

    const newTaskData = {
      ...taskData,
      [strategyName]: {
        ...currentData,
        departmentTasks: [...currentData.departmentTasks, newTask],
      },
    };
    onTaskDataChange?.(newTaskData);
  };

  // Delete department task
  const handleDeleteDeptTask = (strategyName: string, taskId: string) => {
    const currentData = getOrCreateTaskData(strategyName);
    const newDeptTasks = currentData.departmentTasks.filter(task => task.id !== taskId);

    const newTaskData = {
      ...taskData,
      [strategyName]: {
        ...currentData,
        departmentTasks: newDeptTasks,
      },
    };
    onTaskDataChange?.(newTaskData);
  };

  // Filter out empty strategies
  const validStrategies = strategies.filter(s => s && s.trim() !== '');

  if (validStrategies.length === 0) {
    return (
      <div className="task-decomposition-empty">
        <Empty
          description="暂无增长策略"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <p className="hint-text">请在左侧选择对象，并在中间添加增长策略</p>
      </div>
    );
  }

  // Table columns for department tasks
  const getDeptTaskColumns = (strategyName: string) => [
    {
      title: '承接部门',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 140,
      render: (value: string, record: DepartmentTask) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="选择部门"
          value={value || undefined}
          onChange={(val) => handleDeptTaskChange(strategyName, record.id, 'departmentId', val)}
          loading={loadingDepts}
        >
          {departments.map(dept => (
            <Select.Option key={dept.id} value={dept.id}>
              {dept.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '承接任务',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      render: (value: string, record: DepartmentTask) => (
        <Input
          size="small"
          placeholder="输入任务名称"
          value={value}
          onChange={(e) => handleDeptTaskChange(strategyName, record.id, 'taskName', e.target.value)}
        />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      render: (value: string, record: DepartmentTask) => (
        <Input
          size="small"
          placeholder="负责人"
          value={value}
          onChange={(e) => handleDeptTaskChange(strategyName, record.id, 'owner', e.target.value)}
        />
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 100,
      render: (value: string, record: DepartmentTask) => (
        <Input
          size="small"
          placeholder="如: 3月底"
          value={value}
          onChange={(e) => handleDeptTaskChange(strategyName, record.id, 'deadline', e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_: unknown, record: DepartmentTask) => (
        <Tooltip title="删除">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDeptTask(strategyName, record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="task-decomposition-container">
      <div className="save-status-bar">
        {isSaving && (
          <span className="status saving">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} />
            保存中...
          </span>
        )}
        {!isSaving && lastSaved && (
          <span className="status saved">
            <CheckCircleOutlined /> 已自动保存
          </span>
        )}
      </div>

      <Collapse
        accordion={false}
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        className="strategy-collapse"
      >
        {validStrategies.map((strategy, index) => {
          const strategyData = getOrCreateTaskData(strategy);

          return (
            <Panel
              header={
                <div className="strategy-panel-header">
                  <span className="strategy-index">{index + 1}</span>
                  <span className="strategy-name">{strategy}</span>
                  <span className="task-count">
                    <TeamOutlined /> {strategyData.departmentTasks.length} 个部门任务
                  </span>
                </div>
              }
              key={strategy}
              className="strategy-panel"
            >
              <div className="panel-content">
                <div className="section gantt-section">
                  <h4 className="section-title">
                    <span className="title-bar"></span>
                    任务甘特图 (1-12月)
                  </h4>
                  <GanttChart
                    tasks={strategyData.ganttTasks}
                    onTasksChange={(tasks) => handleGanttTasksChange(strategy, tasks)}
                  />
                </div>

                <div className="section dept-section">
                  <h4 className="section-title">
                    <span className="title-bar"></span>
                    部门任务承接
                  </h4>
                  <Table
                    size="small"
                    columns={getDeptTaskColumns(strategy)}
                    dataSource={strategyData.departmentTasks}
                    rowKey="id"
                    pagination={false}
                    bordered
                    className="dept-task-table"
                    locale={{ emptyText: '暂无部门任务' }}
                  />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddDeptTask(strategy)}
                    block
                    className="add-dept-task-btn"
                  >
                    添加部门任务
                  </Button>
                </div>
              </div>
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default TaskDecomposition;
