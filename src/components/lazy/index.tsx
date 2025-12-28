'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';
import React from 'react';

/**
 * 通用加载组件
 */
const LoadingFallback = () => (
                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    minHeight: 200,
                                    width: '100%',
                  }}>
                                    <Spin size="large" tip="加载中..." />
                  </div>
);

/**
 * 懒加载的重型组件
 * 这些组件在用户导航到对应页面时才会被加载
 */

// Dashboard - 总驾驶舱 (包含大量图表)
export const LazyDashboard = dynamic(
                  () => import('@/components/dashboard').then(mod => ({ default: mod.Dashboard })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// PerformanceReview - 绩效复盘 (700+ 行的大组件，包含 recharts)
export const LazyPerformanceReview = dynamic(
                  () => import('@/components/strategy/PerformanceReview'),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// OrganizationSettings - 组织设置
export const LazyOrganizationSettings = dynamic(
                  () => import('@/components/organization').then(mod => ({ default: mod.OrganizationSettings })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// AIConfigPanel - AI 配置面板
export const LazyAIConfigPanel = dynamic(
                  () => import('@/components/enterprise').then(mod => ({ default: mod.AIConfigPanel })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// AccountManagement - 账号管理
export const LazyAccountManagement = dynamic(
                  () => import('@/components/enterprise').then(mod => ({ default: mod.AccountManagement })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// ProfilePanel - 个人中心
export const LazyProfilePanel = dynamic(
                  () => import('@/components/enterprise').then(mod => ({ default: mod.ProfilePanel })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// StrategyDetail - 战略详情 (包含多个子表格)
export const LazyStrategyDetail = dynamic(
                  () => import('@/components/strategy').then(mod => ({ default: mod.StrategyDetail })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// StrategyMap - 战略地图
export const LazyStrategyMap = dynamic(
                  () => import('@/components/strategy').then(mod => ({ default: mod.StrategyMap })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// AISidebar - AI 侧边栏
export const LazyAISidebar = dynamic(
                  () => import('@/components/ai').then(mod => ({ default: mod.AISidebar })),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);

// PerformanceDeduction - 业绩推导
export const LazyPerformanceDeduction = dynamic(
                  () => import('@/components/strategy/PerformanceDeduction'),
                  {
                                    loading: LoadingFallback,
                                    ssr: false,
                  }
);
