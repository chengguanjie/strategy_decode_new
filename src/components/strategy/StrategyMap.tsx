'use client';

import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { ClusterOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DepartmentNode } from '@/types';
import './StrategyMap.scss';

interface StrategyMapProps {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onDepartmentChange?: (deptId: string, deptName: string) => void;
  treeData: DepartmentNode[];
}

const StrategyMap: React.FC<StrategyMapProps> = ({ selectedId, onSelect, onDepartmentChange, treeData }) => {
  const departments = useMemo(() => treeData.map(node => ({
    id: node.key,
    name: node.title as string,
    children: node.children || []
  })), [treeData]);

  const [activeDeptId, setActiveDeptId] = useState<string>('');

  useEffect(() => {
    if (departments.length > 0 && !activeDeptId) {
      setActiveDeptId(departments[0].id);
    }
  }, [departments, activeDeptId]);

  useEffect(() => {
    if (selectedId &&
      selectedId !== 'business-goals' &&
      !['market', 'customer', 'value'].includes(selectedId)) {

      const parts = selectedId.split('-');
      if (parts.length > 1) {
        const potentialDeptId = parts[0];
        if (departments.some(d => d.id === potentialDeptId)) {
          setActiveDeptId(potentialDeptId);
          return;
        }
      }

      const foundDept = departments.find(d =>
        d.id === selectedId ||
        d.children.some(c => c.key === selectedId)
      );
      if (foundDept) setActiveDeptId(foundDept.id);
    }
  }, [selectedId, departments]);

  const activeDept = useMemo(() => 
    departments.find(d => d.id === activeDeptId) || departments[0],
    [departments, activeDeptId]
  );

  useEffect(() => {
    if (activeDeptId && onDepartmentChange) {
      const dept = departments.find(d => d.id === activeDeptId);
      if (dept) {
        onDepartmentChange(dept.id, dept.name);
      }
    }
  }, [activeDeptId, departments, onDepartmentChange]);

  const handleDeptChange: MenuProps['onClick'] = (e) => {
    setActiveDeptId(e.key);
  };

  const menuProps: MenuProps = {
    items: departments.map(d => ({
      key: d.id,
      label: <span style={{ padding: '4px 8px', fontSize: '14px' }}>{d.name}</span>,
    })),
    onClick: handleDeptChange,
    selectedKeys: [activeDeptId]
  };

  const processId = `${activeDeptId}-process`;
  const teamId = `${activeDeptId}-team`;
  const reviewId = `${activeDeptId}-review`;

  return (
    <div className="strategy-map-container">
      <div className="map-header">
        <h2 className="title">
          <ClusterOutlined className="icon-primary" />
          战略地图
        </h2>
        <div className="mini-progress-track">
          <div className="mini-progress-bar" style={{ width: '35%' }}></div>
        </div>
      </div>

      <div className="map-scroll-content">
        <div className="diagram-container upper-diagram">
          <div className="cycle-diagram">
            <div
              className={classNames('center-label', { active: selectedId === 'business-goals' })}
              onClick={() => onSelect('business-goals', '经营目标')}
            >
              经营目标
            </div>

            <div
              className={classNames('cycle-segment market', { active: selectedId === 'market' })}
              onClick={() => onSelect('market', '市场选择')}
            >
              <span className="segment-text market-text">市场选择</span>
            </div>

            <div
              className={classNames('cycle-segment customer', { active: selectedId === 'customer' })}
              onClick={() => onSelect('customer', '客户结构')}
            >
              <span className="segment-text customer-text">客户结构</span>
            </div>

            <div
              className={classNames('cycle-segment value', { active: selectedId === 'value' })}
              onClick={() => onSelect('value', '价值竞争')}
            >
              <span className="segment-text value-text">价值竞争</span>
            </div>

            <div className="separator sep-1"></div>
            <div className="separator sep-2"></div>
            <div className="separator sep-3"></div>
          </div>
        </div>

        <div className="tree-lines item-middle">
          <div className="stem-long"></div>
          <div className="arrow-down-single"><DownOutlined /></div>
        </div>

        <div className="single-dept-container">
          <Dropdown menu={menuProps} trigger={['click']} placement="bottom">
            <div className={classNames("dept-main-node", { active: true })}>
              <span className="dept-label">{activeDept?.name}</span>
              <DownOutlined className="dropdown-icon" />
            </div>
          </Dropdown>
        </div>

        <div className="tree-lines item-bottom">
          <div className="stem-long"></div>
          <div className="arrow-down-single"><DownOutlined /></div>
        </div>

        <div className="diagram-container lower-diagram">
          <div className="cycle-diagram execution-cycle">
            <div
              className={classNames("center-label execution-center", { active: selectedId.includes('execution') })}
              onClick={() => onSelect(`${activeDeptId}-execution`, '战略承接')}
            >
              战略承接
            </div>

            <div
              className={classNames('cycle-segment process', { active: selectedId === processId })}
              onClick={() => onSelect(processId, '业务流程')}
            >
              <span className="segment-text process-text">业务流程</span>
            </div>

            <div
              className={classNames('cycle-segment team', { active: selectedId === teamId })}
              onClick={() => onSelect(teamId, '团队效能')}
            >
              <span className="segment-text team-text">团队效能</span>
            </div>

            <div
              className={classNames('cycle-segment review', { active: selectedId === reviewId })}
              onClick={() => onSelect(reviewId, '复盘管理')}
            >
              <span className="segment-text review-text">复盘管理</span>
            </div>

            <div className="separator sep-1"></div>
            <div className="separator sep-2"></div>
            <div className="separator sep-3"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StrategyMap;
