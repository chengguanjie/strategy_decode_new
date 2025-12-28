'use client';

import React, { useState, useCallback } from 'react';
import { Tooltip, Progress, Input, DatePicker, Button, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import './GanttChart.scss';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

export interface GanttTask {
  id: string;
  name: string;
  startMonth: number; // 1-12
  endMonth: number;   // 1-12
  progress: number;   // 0-100
  color?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  onTasksChange?: (tasks: GanttTask[]) => void;
  readOnly?: boolean;
  year?: number;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const TASK_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa541c', '#2f54eb'];

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTasksChange,
  readOnly = false,
  year = dayjs().year(),
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<GanttTask>>({});

  const handleAddTask = useCallback(() => {
    const currentMonth = dayjs().month() + 1;
    const newTask: GanttTask = {
      id: `task-${Date.now()}`,
      name: '新任务',
      startMonth: currentMonth,
      endMonth: Math.min(currentMonth + 2, 12),
      progress: 0,
      color: TASK_COLORS[tasks.length % TASK_COLORS.length],
    };
    onTasksChange?.([...tasks, newTask]);
  }, [tasks, onTasksChange]);

  const handleDeleteTask = useCallback((taskId: string) => {
    onTasksChange?.(tasks.filter(t => t.id !== taskId));
  }, [tasks, onTasksChange]);

  const handleStartEdit = (task: GanttTask) => {
    setEditingTaskId(task.id);
    setEditingValues({
      name: task.name,
      startMonth: task.startMonth,
      endMonth: task.endMonth,
    });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId) return;

    onTasksChange?.(tasks.map(t =>
      t.id === editingTaskId
        ? { ...t, ...editingValues }
        : t
    ));
    setEditingTaskId(null);
    setEditingValues({});
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingValues({});
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    onTasksChange?.(tasks.map(t =>
      t.id === taskId ? { ...t, progress } : t
    ));
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setEditingValues({
        ...editingValues,
        startMonth: dates[0].month() + 1,
        endMonth: dates[1].month() + 1,
      });
    }
  };

  const getBarStyle = (task: GanttTask) => {
    const startOffset = ((task.startMonth - 1) / 12) * 100;
    const width = ((task.endMonth - task.startMonth + 1) / 12) * 100;
    return {
      left: `${startOffset}%`,
      width: `${width}%`,
      backgroundColor: task.color || TASK_COLORS[0],
    };
  };

  return (
    <div className="gantt-chart-container">
      <div className="gantt-header">
        <div className="gantt-task-column">任务名称</div>
        <div className="gantt-timeline">
          {MONTHS.map((month, idx) => (
            <div key={idx} className="gantt-month-cell">
              {month}
            </div>
          ))}
        </div>
        <div className="gantt-progress-column">进度</div>
        {!readOnly && <div className="gantt-action-column">操作</div>}
      </div>

      <div className="gantt-body">
        {tasks.map((task) => (
          <div key={task.id} className="gantt-row">
            <div className="gantt-task-column">
              {editingTaskId === task.id ? (
                <Input
                  size="small"
                  value={editingValues.name}
                  onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              ) : (
                <Tooltip title={task.name}>
                  <span className="task-name">{task.name}</span>
                </Tooltip>
              )}
            </div>

            <div className="gantt-timeline">
              {editingTaskId === task.id ? (
                <div className="date-picker-overlay">
                  <RangePicker
                    picker="month"
                    size="small"
                    value={[
                      dayjs().year(year).month((editingValues.startMonth || task.startMonth) - 1),
                      dayjs().year(year).month((editingValues.endMonth || task.endMonth) - 1)
                    ]}
                    onChange={handleDateRangeChange}
                    format="M月"
                  />
                </div>
              ) : (
                <>
                  <div className="gantt-grid">
                    {MONTHS.map((_, idx) => (
                      <div key={idx} className="gantt-grid-cell" />
                    ))}
                  </div>
                  <Tooltip title={`${task.startMonth}月 - ${task.endMonth}月 (进度: ${task.progress}%)`}>
                    <div className="gantt-bar" style={getBarStyle(task)}>
                      <div
                        className="gantt-bar-progress"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </Tooltip>
                </>
              )}
            </div>

            <div className="gantt-progress-column">
              {readOnly ? (
                <Progress percent={task.progress} size="small" />
              ) : (
                <Progress
                  percent={task.progress}
                  size="small"
                  format={(percent) => (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      size="small"
                      value={percent}
                      onChange={(e) => handleProgressChange(task.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{ width: 50 }}
                      suffix="%"
                    />
                  )}
                />
              )}
            </div>

            {!readOnly && (
              <div className="gantt-action-column">
                {editingTaskId === task.id ? (
                  <>
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={handleSaveEdit}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={handleCancelEdit}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit(task)}
                    />
                    <Popconfirm
                      title="确定删除此任务?"
                      onConfirm={() => handleDeleteTask(task.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="gantt-empty">暂无任务</div>
        )}
      </div>

      {!readOnly && (
        <div className="gantt-footer">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddTask}
            block
          >
            添加任务
          </Button>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
