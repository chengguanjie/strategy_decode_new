'use client';

import React from 'react';
import { Input, Dropdown, Menu } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Resizable, type ResizeCallbackData } from 'react-resizable';
import type { TableColumn, TableDataRow } from './useStrategyTableData';

/**
 * Internal component to handle text input with Chinese IME composition support
 */
interface EditableInputProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  autoSize?: boolean | object;
}

export const EditableInput: React.FC<EditableInputProps> = ({ value, onChange, style, autoSize }) => {
  const [localValue, setLocalValue] = React.useState(value);
  const isComposingRef = React.useRef(false);

  React.useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (!isComposingRef.current) {
      onChange(newValue);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    // Ensure we sync the final composed value
    const newValue = (e.target as HTMLTextAreaElement).value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <Input.TextArea
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      bordered={false}
      autoSize={autoSize}
      style={style}
    />
  );
};

/**
 * ResizableTitle - A resizable table header cell component.
 */
interface ResizableTitleProps extends React.HTMLAttributes<HTMLTableCellElement> {
  onResize: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  width?: number;
  onDelete?: () => void;
}

export const ResizableTitle: React.FC<ResizableTitleProps> = (props) => {
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
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps}>{cellContent}</th>
    </Resizable>
  );
};

/**
 * ResizableBodyCell - A resizable table body cell component.
 */
interface ResizableBodyCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  record: TableDataRow;
  onRowResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  height?: number;
  onDelete?: () => void;
}

export const ResizableBodyCell: React.FC<ResizableBodyCellProps> = (props) => {
  const { record: _record, children, className, onRowResize, height, onDelete, ...restProps } = props;

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
            style={{
              bottom: 0,
              left: 0,
              width: '100%',
              height: '5px',
              cursor: 'row-resize',
              position: 'absolute',
              zIndex: 10,
            }}
          />
        }
        onResize={onRowResize}
        draggableOpts={{ enableUserSelectHack: false }}
      >
        <td
          {...restProps}
          className={`${className || ''} resizable-row-cell`}
          style={{ ...restProps.style, height: height, position: 'relative' }}
        >
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

/**
 * Pre-configured table components for Ant Design Table.
 */
export const editableTableComponents = {
  header: {
    cell: ResizableTitle,
  },
  body: {
    cell: ResizableBodyCell,
  },
};

export interface UseEditableTableOptions {
  columns: TableColumn[];
  setColumns: React.Dispatch<React.SetStateAction<TableColumn[]>>;
  data: TableDataRow[];
  setData: React.Dispatch<React.SetStateAction<TableDataRow[]>>;
  rowHeights: Record<string, number>;
  setRowHeights: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  fontSize?: number;
  minColumns?: number;
  minRows?: number;
}

/**
 * useEditableTable - A hook providing common editable table operations.
 */
export function useEditableTable(options: UseEditableTableOptions) {
  const {
    columns,
    setColumns,
    data,
    setData,
    rowHeights,
    setRowHeights,
    fontSize = 14,
    minColumns = 1,
    minRows = 1,
  } = options;

  /**
   * Handle column resize
   */
  const handleColumnResize = (index: number) => (e: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setColumns((prevColumns) => {
      const nextColumns = [...prevColumns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return nextColumns;
    });
  };

  /**
   * Handle row resize
   */
  const handleRowResize = (key: string) => (e: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setRowHeights((prev) => ({
      ...prev,
      [key]: size.height,
    }));
  };

  /**
   * Add a new column
   */
  const handleAddColumn = (index?: number, defaultTitle = '新列') => {
    const newColId = `col-${Date.now()}`;
    const newCol: TableColumn = {
      title: defaultTitle,
      dataIndex: newColId,
      key: newColId,
      width: 200,
    };

    if (typeof index === 'number') {
      const newCols = [...columns];
      newCols.splice(index + 1, 0, newCol);
      setColumns(newCols);
    } else {
      setColumns([...columns, newCol]);
    }

    setData(data.map((row) => ({ ...row, [newColId]: '' })));
  };

  /**
   * Add a new row
   */
  const handleAddRow = (defaultValues?: Record<string, string | number>) => {
    const newKey = `row-${Date.now()}`;
    const newRow: TableDataRow = { key: newKey, ...defaultValues };
    columns.forEach((col) => {
      if (col.dataIndex && newRow[col.dataIndex] === undefined) {
        newRow[col.dataIndex] = '';
      }
    });
    setData([...data, newRow]);
  };

  /**
   * Delete a row
   */
  const handleDeleteRow = (key: string) => {
    if (data.length <= minRows) return;
    setData(data.filter((item) => item.key !== key));
  };

  /**
   * Delete a column
   */
  const handleDeleteColumn = (colKey: string) => {
    if (columns.length <= minColumns) return;
    setColumns(columns.filter((col) => col.key !== colKey));
  };

  /**
   * Handle cell value change
   */
  const handleCellChange = (key: string, dataIndex: string, value: string) => {
    setData((prevData) =>
      prevData.map((row) =>
        row.key === key ? { ...row, [dataIndex]: value } : row
      )
    );
  };

  /**
   * Handle column title change
   */
  const handleColumnTitleChange = (colKey: string, newTitle: string) => {
    setColumns((prevCols) =>
      prevCols.map((col) =>
        col.key === colKey ? { ...col, title: newTitle } : col
      )
    );
  };

  /**
   * Create header cell title element with editable input and add button
   */
  const createHeaderTitle = (col: TableColumn, index: number, isFirstCol: boolean) => {
    return (
      <div
        className="header-cell-hover-target"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <EditableInput
          value={typeof col.title === 'string' ? col.title : ''}
          onChange={(value) => handleColumnTitleChange(col.key, value)}
          autoSize
          style={{
            fontWeight: 'bold',
            textAlign: isFirstCol ? 'left' : 'center',
            padding: 0,
            background: 'transparent',
            resize: 'none',
            fontSize: fontSize,
          }}
        />
        <div
          className="add-column-trigger"
          onClick={(e) => {
            e.stopPropagation();
            handleAddColumn(index);
          }}
        >
          <div className="add-icon">
            <PlusOutlined />
          </div>
        </div>
      </div>
    );
  };

  /**
   * Create body cell content element with editable input
   */
  const createCellContent = (
    text: string,
    record: TableDataRow,
    col: TableColumn,
    isFirstCol: boolean
  ) => {
    return (
      <div
        className="body-cell-hover-target"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <EditableInput
          autoSize
          value={(typeof text === 'string' || typeof text === 'number') ? String(text) : ''}
          onChange={(value) =>
            handleCellChange(record.key as string, col.dataIndex!, value)
          }
          style={{
            textAlign: isFirstCol ? 'left' : 'left',
            fontWeight: isFirstCol ? 'bold' : 'normal',
            padding: '4px 0',
            resize: 'none',
            minHeight: '32px',
            fontSize: fontSize,
          }}
        />
      </div>
    );
  };

  /**
   * Build merged columns with all handlers attached
   */
  const buildMergedColumns = (customRender?: (col: TableColumn, index: number) => any) => {
    return columns.map((col, index) => {
      const isFirstCol = index === 0;

      const mergedCol: any = {
        ...col,
        onHeaderCell: (column: TableColumn) => ({
          width: column.width,
          onResize: handleColumnResize(index),
          onDelete: () => handleDeleteColumn(column.key),
        }),
        onCell: (record: TableDataRow) =>
        ({
          record,
          onDelete: () => handleDeleteRow(record.key as string),
          onRowResize: isFirstCol
            ? handleRowResize(record.key as string)
            : undefined,
          height: rowHeights[record.key as string],
        }),
        title: createHeaderTitle(col, index, isFirstCol),
      };

      if (customRender) {
        mergedCol.render = customRender(col, index);
      } else {
        mergedCol.render = (text: string, record: TableDataRow) =>
          createCellContent(text, record, col, isFirstCol);
      }

      return mergedCol;
    });
  };

  return {
    // Handlers
    handleColumnResize,
    handleRowResize,
    handleAddColumn,
    handleAddRow,
    handleDeleteRow,
    handleDeleteColumn,
    handleCellChange,
    handleColumnTitleChange,
    // Builders
    createHeaderTitle,
    createCellContent,
    buildMergedColumns,
    // Components
    components: editableTableComponents,
  };
}

export default useEditableTable;
