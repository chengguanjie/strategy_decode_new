'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RocketOutlined,
  DashboardOutlined,
  PoweroffOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  DownOutlined,
  UpOutlined,
  SyncOutlined,
  ApartmentOutlined,
  UserOutlined,
  ThunderboltOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  LineChartOutlined
} from '@ant-design/icons';
// 使用懒加载组件以优化首次加载性能
import {
  LazyDashboard,
  LazyPerformanceReview,
  LazyOrganizationSettings,
  LazyAIConfigPanel,
  LazyAccountManagement,
  LazyProfilePanel,
  LazyStrategyDetail,
  LazyStrategyMap,
  LazyAISidebar,
  LazyPerformanceDeduction,
} from '@/components/lazy';
import { INITIAL_CONTENT, DEFAULT_AI_CONFIG, UI_CONFIG } from '@/lib/constants';
import { BlockContent, DepartmentNode } from '@/types';
import './page.scss';

const { Sider, Content } = Layout;

interface ApiDepartment {
  id: string;
  name: string;
  parentId: string | null;
  leader: string | null;
  memberCount: number;
}

export default function EnterprisePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('market');
  const [treeData, setTreeData] = useState<DepartmentNode[]>([]);
  const [activeDeptName, setActiveDeptName] = useState<string>('');

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>('decode');
  const [isMounted, setIsMounted] = useState(false);

  // AI Config State
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG);

  // Current user info
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [enterpriseInfo, setEnterpriseInfo] = useState<any>(null);

  const [mapWidth, setMapWidth] = useState(UI_CONFIG.MAP_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const buildTreeData = (departments: ApiDepartment[]): DepartmentNode[] => {
    const map = new Map<string, DepartmentNode>();
    const roots: DepartmentNode[] = [];

    departments.forEach(dept => {
      map.set(dept.id, { key: dept.id, title: dept.name, children: [] });
    });

    departments.forEach(dept => {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/enterprise/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        // API 返回格式: { success: true, data: [...] }
        const data: ApiDepartment[] = result.data || result;
        setTreeData(buildTreeData(Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Failed to fetch departments:', e);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/enterprise/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(userStr));
    } catch (e) {
      console.error('Failed to parse user info:', e);
      router.push('/enterprise/login');
      return;
    }

    const savedMenu = localStorage.getItem('enterprise_active_menu');
    if (savedMenu) {
      setActiveMenu(savedMenu);
    }
    const savedAiConfig = localStorage.getItem('ai_config');
    if (savedAiConfig) {
      try {
        const config = JSON.parse(savedAiConfig);
        setAiConfig(config);
      } catch (e) {
        console.error('Failed to load AI config:', e);
      }
    }
    fetchDepartments();
  }, [fetchDepartments, router]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('enterprise_active_menu', activeMenu);
    }
  }, [activeMenu, isMounted]);

  const fetchEnterpriseInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!currentUser?.enterpriseId) return;

      const res = await fetch(`/api/enterprises/${currentUser.enterpriseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        // API 返回格式: { success: true, data: {...} }
        setEnterpriseInfo(result.data || result);
      }
    } catch (e) {
      console.error('Failed to fetch enterprise info:', e);
    }
  }, [currentUser?.enterpriseId]);

  useEffect(() => {
    if (currentUser?.enterpriseId) {
      fetchEnterpriseInfo();
    }
  }, [currentUser, fetchEnterpriseInfo]);

  // Resize handlers
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const navWidth = navCollapsed ? UI_CONFIG.NAV_COLLAPSED_WIDTH : UI_CONFIG.NAV_EXPANDED_WIDTH;
        const newWidth = mouseMoveEvent.clientX - navWidth;
        if (newWidth >= UI_CONFIG.MAP_MIN_WIDTH && newWidth <= UI_CONFIG.MAP_MAX_WIDTH) {
          setMapWidth(newWidth);
        }
      }
    },
    [isResizing, navCollapsed]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const getContent = (id: string): BlockContent => {
    if (INITIAL_CONTENT[id]) {
      return INITIAL_CONTENT[id];
    }
    if (id.includes('-process')) return INITIAL_CONTENT['template-process'];
    if (id.includes('-team')) return INITIAL_CONTENT['template-team'];
    if (id.includes('-review')) return INITIAL_CONTENT['template-review'];
    if (id.includes('execution')) return INITIAL_CONTENT['strategy-execution'];

    return INITIAL_CONTENT['default'];
  };

  const currentContent = getContent(selectedId);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    router.push('/enterprise/login');
  };

  const renderMainView = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: 0, background: '#f0f2f5' }}>
            <LazyDashboard />
          </Content>
        );

      case 'deduction':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: '12px', background: '#f0f2f5', overflow: 'hidden' }}>
            <LazyPerformanceDeduction />
          </Content>
        );

      case 'review':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: 0, background: '#fff', overflow: 'auto' }}>
            <LazyPerformanceReview />
          </Content>
        );

      case 'org':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: 0, background: '#fff' }}>
            <LazyOrganizationSettings />
          </Content>
        );

      case 'profile':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: '24px', background: '#f0f2f5', overflowY: 'auto' }}>
            <LazyProfilePanel currentUser={currentUser} enterpriseInfo={enterpriseInfo} />
          </Content>
        );

      case 'account':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: '24px', background: '#f0f2f5', overflowY: 'auto' }}>
            <LazyAccountManagement currentUserId={currentUser?.id} />
          </Content>
        );

      case 'aiconfig':
        return (
          <Content className="strategy-content" style={{ height: '100%', padding: '24px', background: '#f0f2f5', overflowY: 'auto' }}>
            <LazyAIConfigPanel initialConfig={aiConfig} onConfigChange={setAiConfig} />
          </Content>
        );

      default:
        return (
          <>
            <Sider
              width={mapWidth}
              theme="light"
              className="strategy-map-sider"
              collapsible
              collapsed={mapCollapsed}
              trigger={null}
              collapsedWidth={0}
            >
              <LazyStrategyMap
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                onDepartmentChange={(_, name) => setActiveDeptName(name)}
                treeData={treeData}
              />
              {!mapCollapsed && (
                <div
                  className="resize-handle"
                  onMouseDown={startResizing}
                />
              )}
            </Sider>

            <Content className="strategy-content">
              <div
                className="map-toggle-btn"
                onClick={() => setMapCollapsed(!mapCollapsed)}
              >
                {mapCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>

              <LazyStrategyDetail content={currentContent} departmentName={activeDeptName} />

              <LazyAISidebar
                pageTitle={currentContent.title}
                pageContent={JSON.stringify(currentContent)}
              />
            </Content>
          </>
        );
    }
  };

  return (
    <div className={`strategy-page-container ${isResizing ? 'resizing' : ''}`}>
      <Layout className="strategy-page-layout">
        <Sider
          theme="dark"
          className="main-nav-sider"
          collapsible
          collapsed={navCollapsed}
          trigger={null}
          collapsedWidth={UI_CONFIG.NAV_COLLAPSED_WIDTH}
          width={UI_CONFIG.NAV_EXPANDED_WIDTH}
        >
          <div className="nav-top">
            <div className="app-header-row">
              <div className="app-logo">
                <div className="logo-box">
                  <RocketOutlined className="logo-icon" />
                </div>
                {!navCollapsed && <span className="app-name">战略绩效</span>}
              </div>

              <div className="nav-trigger-btn" onClick={() => setNavCollapsed(!navCollapsed)}>
                {navCollapsed ? <RightOutlined /> : <LeftOutlined />}
              </div>
            </div>

            <div className="nav-menu">
              <div
                className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveMenu('dashboard')}
              >
                <DashboardOutlined />
                {!navCollapsed && <span>总驾驶舱</span>}
              </div>

              <div
                className={`menu-item ${activeMenu === 'decode' ? 'active' : ''}`}
                onClick={() => setActiveMenu('decode')}
              >
                <RocketOutlined />
                {!navCollapsed && <span>战略解码</span>}
              </div>

              <div
                className={`menu-item ${activeMenu === 'deduction' ? 'active' : ''}`}
                onClick={() => setActiveMenu('deduction')}
              >
                <LineChartOutlined />
                {!navCollapsed && <span>业绩推导</span>}
              </div>

              <div
                className={`menu-item ${activeMenu === 'review' ? 'active' : ''}`}
                onClick={() => setActiveMenu('review')}
              >
                <SyncOutlined />
                {!navCollapsed && <span>绩效复盘</span>}
              </div>

              <div
                className={`menu-item ${activeMenu === 'org' ? 'active' : ''}`}
                onClick={() => setActiveMenu('org')}
              >
                <ApartmentOutlined />
                {!navCollapsed && <span>组织设置</span>}
              </div>

              <div
                className={`menu-item ${activeMenu === 'aiconfig' ? 'active' : ''}`}
                onClick={() => setActiveMenu('aiconfig')}
              >
                <ThunderboltOutlined />
                {!navCollapsed && <span>AI 配置</span>}
              </div>
            </div>
          </div>

          <div className="nav-bottom">
            <div
              className={`admin-trigger ${adminExpanded ? 'active' : ''}`}
              onClick={() => setAdminExpanded(!adminExpanded)}
            >
              <div className="trigger-content">
                <MenuOutlined className="main-icon" />
                {!navCollapsed && <span className="admin-label">系统设置</span>}
              </div>
              {!navCollapsed && (
                <div className="arrow-icon">
                  {adminExpanded ? <DownOutlined /> : <UpOutlined />}
                </div>
              )}
            </div>

            {adminExpanded && (
              <div className="admin-submenu">
                <div className={`submenu-item ${activeMenu === 'profile' ? 'active' : ''}`} onClick={() => setActiveMenu('profile')}>
                  <UserOutlined />
                  {!navCollapsed && <span>个人中心</span>}
                </div>
                <div className={`submenu-item ${activeMenu === 'account' ? 'active' : ''}`} onClick={() => setActiveMenu('account')}>
                  <SettingOutlined />
                  {!navCollapsed && <span>账号管理</span>}
                </div>
                <div className="submenu-item danger" onClick={handleLogout}>
                  <PoweroffOutlined />
                  {!navCollapsed && <span>退出登录</span>}
                </div>
              </div>
            )}
          </div>
        </Sider>

        {renderMainView()}
      </Layout>
    </div>
  );
}
