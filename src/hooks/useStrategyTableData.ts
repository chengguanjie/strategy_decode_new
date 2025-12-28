'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

/**
 * 表格类型定义
 */
export type TableType =
  | 'financial'
  | 'market'
  | 'value'
  | 'process'
  | 'team'
  | 'review'
  | 'department_strategy'
  | 'performance_deduction'
  | 'growth_strategies'
  | 'task_decomposition';

/**
 * 列定义接口
 */
export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  dataIndex?: string;
  editable?: boolean;
  fixed?: 'left' | 'right';
}

/**
 * 表格数据接口
 */
export interface TableDataRow {
  key: string;
  [field: string]: string | number | undefined;
}

/**
 * API响应数据接口
 */
interface StrategyTableResponse {
  success: boolean;
  data: {
    exists: boolean;
    id?: string;
    tableType?: string;
    departmentId?: string | null;
    columns?: TableColumn[];
    data?: TableDataRow[];
    rowHeights?: Record<string, number>;
    version?: number;
    updatedAt?: string;
  };
  message?: string;
}

/**
 * Hook配置选项
 */
interface UseStrategyTableDataOptions {
  tableType: TableType | string; // Allow string for custom tables like in CustomerStructureTabs
  departmentId?: string | null;
  defaultColumns: TableColumn[];
  defaultData: TableDataRow[];
  debounceMs?: number;
  apiEndpoint?: string; // New option for custom API endpoint
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

/**
 * Hook返回值接口
 */
interface UseStrategyTableDataReturn {
  columns: TableColumn[];
  setColumns: React.Dispatch<React.SetStateAction<TableColumn[]>>;
  data: TableDataRow[];
  setData: React.Dispatch<React.SetStateAction<TableDataRow[]>>;
  rowHeights: Record<string, number>;
  setRowHeights: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isLoading: boolean;
  isSaving: boolean;
  hasPendingChanges: boolean;
  error: Error | null;
  lastSaved: Date | null;
  save: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * 战略表格数据持久化Hook
 *
 * 提供数据加载、保存和防抖功能
 */
export function useStrategyTableData(options: UseStrategyTableDataOptions): UseStrategyTableDataReturn {
  const {
    tableType,
    departmentId,
    defaultColumns,
    defaultData,
    debounceMs = 1000,
    apiEndpoint = '/api/enterprise/strategy-table', // Default endpoint
    onSaveSuccess,
    onSaveError,
    onLoadSuccess,
    onLoadError,
  } = options;

  const [columns, setColumns] = useState<TableColumn[]>(defaultColumns);
  const [data, setData] = useState<TableDataRow[]>(defaultData);
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 用于防抖的定时器引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 标记是否已初始化加载
  const isInitializedRef = useRef(false);
  // 标记是否有待保存的更改
  const hasPendingChangesRef = useRef(false);
  // 标记是否正在从服务器加载数据（用于避免加载后立即触发保存）
  const isLoadingFromServerRef = useRef(false);

  // 用于取消请求的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 使用 refs 存储最新的数据值，避免 saveData 依赖于 state
  const columnsRef = useRef<TableColumn[]>(columns);
  const dataRef = useRef<TableDataRow[]>(data);
  const rowHeightsRef = useRef<Record<string, number>>(rowHeights);

  // 同步 refs 与 state
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    rowHeightsRef.current = rowHeights;
  }, [rowHeights]);

  // 存储回调函数的 refs
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    onSaveSuccessRef.current = onSaveSuccess;
    onSaveErrorRef.current = onSaveError;
  }, [onSaveSuccess, onSaveError]);

  /**
   * 获取认证令牌
   */
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  /**
   * 从API加载数据
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      isLoadingFromServerRef.current = true;

      const token = getAuthToken();
      if (!token) {
        console.log(`[${tableType}] 无token，跳过加载`);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({ tableType });
      // 始终传递 departmentId 参数，即使是空值也使用空字符串
      params.append('departmentId', departmentId || '');

      console.log(`[${tableType}] 开始加载数据, departmentId:`, departmentId || '(空)');
      console.log(`[${tableType}] 请求URL:`, `${apiEndpoint}?${params}`);

      const response = await fetch(`${apiEndpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log(`[${tableType}] 响应状态:`, response.status);
      const result: StrategyTableResponse = await response.json();
      console.log(`[${tableType}] 响应内容:`, result);

      if (!response.ok) {
        // 处理认证失败：清除 token 并跳转登录页
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          message.error('登录已过期，请重新登录');
          window.location.href = '/enterprise/login';
          return;
        }
        throw new Error(result.message || '加载数据失败');
      }

      if (result.data.exists && result.data.columns && result.data.data) {
        console.log(`[${tableType}] 加载已有数据:`, result.data);
        // 确保每个列都有 dataIndex 字段（修复历史数据缺失问题）
        const normalizedColumns = result.data.columns.map(col => ({
          ...col,
          dataIndex: col.dataIndex || col.key, // 如果 dataIndex 缺失，从 key 恢复
        }));
        setColumns(normalizedColumns);
        setData(result.data.data);
        if (result.data.rowHeights) {
          setRowHeights(result.data.rowHeights);
        }
        setLastSaved(result.data.updatedAt ? new Date(result.data.updatedAt) : new Date());
        hasPendingChangesRef.current = false;
        setHasPendingChanges(false);
      } else {
        console.log(`[${tableType}] 无已有数据，使用默认值`);
        setLastSaved(null);
        hasPendingChangesRef.current = false;
        setHasPendingChanges(false);
      }

      onLoadSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载数据失败');
      setError(error);
      onLoadError?.(error);
      console.error('Failed to load strategy table data:', err);
      // 加载失败通常不显示全局 message，以免打扰用户，但在组件内显示状态
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true;
      // 延迟重置加载标志，确保 React 状态更新完成后再允许自动保存
      setTimeout(() => {
        isLoadingFromServerRef.current = false;
      }, 100);
    }
  }, [tableType, departmentId, apiEndpoint, onLoadSuccess, onLoadError]);

  /**
   * 保存数据到API - 从 refs 中读取最新数据
   */
  const saveData = useCallback(async () => {
    if (!isInitializedRef.current) return;

    let controller: AbortController | null = null;

    try {
      // 如果有正在进行的请求，取消它
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('New save request started');
      }

      // 创建新的 AbortController
      controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSaving(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setIsSaving(false);
        return;
      }

      // 从 refs 中读取最新数据
      const currentColumns = columnsRef.current;
      const currentData = dataRef.current;
      const currentRowHeights = rowHeightsRef.current;

      // 确保每个列都有 dataIndex 字段（防止丢失）
      const normalizedColumns = currentColumns.map(col => ({
        ...col,
        dataIndex: col.dataIndex || col.key,
      }));

      // 使用空字符串而非 null，保持与查询一致
      const requestBody = {
        tableType,
        departmentId: departmentId || '',
        columns: normalizedColumns,
        data: currentData,
        rowHeights: Object.keys(currentRowHeights).length > 0 ? currentRowHeights : undefined,
      };

      console.log(`[${tableType}] 开始保存数据:`, {
        tableType,
        departmentId: departmentId || '(空)',
        columnsCount: normalizedColumns.length,
        dataRowsCount: currentData.length,
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        // 处理认证失败：清除 token 并跳转登录页
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          message.error('登录已过期，请重新登录');
          window.location.href = '/enterprise/login';
          return;
        }
        throw new Error(result.error?.message || '保存数据失败');
      }

      console.log(`[${tableType}] 保存成功:`, result);
      setLastSaved(new Date());
      hasPendingChangesRef.current = false;
      setHasPendingChanges(false);
      onSaveSuccessRef.current?.();

      // 请求成功完成后清理引用
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    } catch (err: unknown) {
      // 忽略中止错误 - 检查多种可能的中止错误情况
      if (err instanceof Error) {
        if (
          err.name === 'AbortError' ||
          err.message.includes('aborted') ||
          err.message.includes('New save request started')
        ) {
          return;
        }
      }

      // 处理字符串类型的错误
      if (typeof err === 'string' && (err.includes('aborted') || err.includes('New save request started'))) {
        return;
      }

      const error = err instanceof Error ? err : new Error('保存数据失败');
      setError(error);
      onSaveErrorRef.current?.(error);

      // 优化错误消息
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        message.error('网络连接不稳定，请检查网络');
      } else {
        message.warning('保存失败，系统将尝试再次同步');
      }

      console.error('Failed to save strategy table data:', err);
    } finally {
      // 只有当是当前活跃的控制器时才重置状态
      if (controller && (abortControllerRef.current === controller || abortControllerRef.current === null)) {
        setIsSaving(false);
      }
    }
  }, [tableType, departmentId, apiEndpoint]); // 不依赖 columns, data, rowHeights

  /**
   * 防抖保存 - 使用稳定的函数引用
   */
  const debouncedSave = useCallback(() => {
    // 如果未初始化或正在从服务器加载，不触发保存
    if (!isInitializedRef.current || isLoadingFromServerRef.current) return;

    hasPendingChangesRef.current = true;
    setHasPendingChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, debounceMs);
  }, [saveData, debounceMs]);

  /**
   * 手动触发保存
   */
  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveData();
  }, [saveData]);

  /**
   * 重新加载数据
   */
  const reload = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 数据变化时自动保存（防抖）- 不依赖 debouncedSave 避免循环
  useEffect(() => {
    if (isInitializedRef.current) {
      debouncedSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, data, rowHeights]);

  // 组件卸载时清理定时器并保存未保存的更改
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 如果有待保存的更改，立即保存
      if (hasPendingChangesRef.current) {
        saveData();
      }
    };
  }, [saveData]);

  return {
    columns,
    setColumns,
    data,
    setData,
    rowHeights,
    setRowHeights,
    isLoading,
    isSaving,
    hasPendingChanges,
    error,
    lastSaved,
    save,
    reload,
  };
}

export default useStrategyTableData;
