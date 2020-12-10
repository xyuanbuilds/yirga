import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  forwardRef,
  useContext,
  useCallback,
  useImperativeHandle,
} from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import ResizeObserver from 'rc-resize-observer';
import { Table, Form, Checkbox } from 'antd';
import type { FormInstance } from 'antd/lib/form';
import { SelectedRowsContext } from './index';
import styles from './CustomTable.less';

function VirtualTable(props, ref) {
  const {
    columns,
    height,
    form,
    lines,
    rowHeight,
    disabled,
    ...resetTableProps
  } = props;
  const [tableWidth, setTableWidth] = useState(0);

  const dataSource = Array(lines)
    .fill(null)
    .map((_, index) => {
      return {
        index: index + 1,
      };
    });

  const mergedColumns = useMemo(() => {
    const widthColumnCount = columns.filter(({ width }) => !width).length;

    const widthAlready = columns.reduce((pre, cur) => {
      if (typeof cur.width === 'number') {
        return cur.width + pre;
      }
      return pre;
    }, 0);

    const widthForUse = Math.floor(
      (tableWidth - widthAlready) / widthColumnCount,
    );
    return columns.map((column) => {
      if (column.width) {
        return column;
      }
      return {
        ...column,
        width: widthForUse < 80 ? 80 : widthForUse,
      };
    });
  }, [columns, tableWidth]);

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => null,
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });
    return obj;
  });

  useImperativeHandle(ref, () => gridRef.current);

  const resetVirtualGrid = () => {
    if (gridRef.current)
      gridRef.current.resetAfterIndices({
        columnIndex: 0,
        shouldForceUpdate: false,
      });
  };

  useEffect(() => {
    resetVirtualGrid();
  }, [mergedColumns, height, rowHeight]);

  const renderVirtualList = (
    rawData: Record<string, unknown>[],
    { scrollbarSize, ref: innerRef, onScroll }: any,
  ) => {
    innerRef.current = connectObject;
    // const totalHeight = rawData.length * rowHeight;

    return (
      <Grid
        ref={gridRef}
        columnCount={mergedColumns.length}
        columnWidth={(index) => {
          const { width } = mergedColumns[index];
          return index === mergedColumns.length - 1
            ? width - scrollbarSize - 1
            : width;
        }}
        height={height - rowHeight}
        rowCount={rawData.length}
        rowHeight={() => rowHeight}
        width={tableWidth - 1}
        onScroll={({ scrollLeft }) => {
          onScroll({ scrollLeft });
        }}
      >
        {({ columnIndex, rowIndex, style }) => {
          const curColumn = mergedColumns[columnIndex];

          const curData =
            rawData[rowIndex][
              curColumn[curColumn.dataIndex || curColumn.field]
            ];
          // console.log(rawData, curData);
          if (!curColumn.renderForm && curColumn.render) {
            return (
              <div className={styles.tableCell} style={style}>
                {curColumn.render(
                  null,
                  null,
                  rowIndex,
                  rawData.length === rowIndex + 1,
                )}
              </div>
            );
          }
          return (
            <div className={styles.tableCell} style={style}>
              <EditableCell
                form={form}
                record={rawData[rowIndex]}
                line={rowIndex + 1}
                fieldName={fieldName}
                data={curData}
                {...curColumn}
              />
            </div>
          );
        }}
      </Grid>
    );
  };

  const renderCell = (cellProps: Record<string, unknown>) => {
    const { children } = cellProps;
    if (
      (Array.isArray(children) ? children : []).find(
        (i) => i === 'SELECT_COLUMN',
      )
    ) {
      return (
        <th>
          <div>
            <AllSelectCheckBox disabled={disabled} />
          </div>
        </th>
      );
    }
    return <th {...cellProps} />;
  };

  const customComponents = useMemo<
    import('rc-table/lib/interface.d').TableComponents<any>
  >(() => {
    return {
      header: {
        cell: renderCell,
      },
      body: renderVirtualList,
    };
  }, [mergedColumns, height, rowHeight]);

  const resizableListener = useCallback(({ offsetWidth }) => {
    setTableWidth(offsetWidth);
  }, []);

  const scroll = useMemo(() => {
    return {
      y: height - rowHeight,
      x: 'max-content',
    };
  }, [height, rowHeight]);

  return (
    <ResizeObserver onResize={resizableListener}>
      {tableWidth ? (
        <Table
          {...resetTableProps}
          scroll={scroll}
          columns={mergedColumns}
          pagination={false}
          components={customComponents}
          dataSource={dataSource}
        />
      ) : (
        <div style={{ height: '100%', width: '100%' }} />
      )}
    </ResizeObserver>
  );
}

interface RenderCellProps<RecordType> {
  line: number;
  data: any;
  title?: string;
  // required?: boolean;
  // rules?: any;
  /** 唯一 字段名称 */
  field?: string;
  renderForm: () => React.ReactNode;
  /** Item render-props 下的控制Item显隐的逻辑 */
  shouldItemHidden?: (form: FormInstance, info: { name: string }) => boolean;
  /** Item render-props 下的控制Item刷新的逻辑 */
  shouldItemUpdate?: (
    name: string,
  ) => (pre: Array<unknown>, cur: Array<unknown>) => boolean;
  render?: (data: any, record: RecordType, index: number) => React.ReactNode;
}

function EditableCell({
  field,
  data: curValue,
  renderForm,
  handleSave,
  index,
  shouldItemHidden,
  shouldItemUpdate,
}) {
  const name = [index, field];
  const save = () => {
    try {
      const value = form.getFieldValue(name);
      handleSave(name, value);
      return { value, name };
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
      return {};
    }
  };
}

function BasicCell({ name, index, field }) {
  const curName = name || [index, field];
  return (
    <Form.Item
      name={name}
      preserve={false}
      valuePropName={valuePropName}
      rules={rules}
    >
      {FormElement
        ? React.cloneElement(FormElement, {
            onChange: (...params) => {
              collectFormValues();
              if (FormElement.props.onChange)
                FormElement.props.onChange(...params);
            },
          })
        : null}
    </Form.Item>
  );
}

function CustomCell({ index, dependentField, field, shouldItemHidden }) {
  const name = [index, field];
  const dependentName = [index, dependentField];
  const [hidden, setHidden] = useState(false);
  return (
    <Form.Item
      hidden={hidden}
      noStyle={!hidden}
      shouldUpdate={(prevValues, curValues) => {
        const prevV = dependentName.reduce((res, cur) => res[cur], prevValues);
        const curV = dependentName.reduce((res, cur) => res[cur], curValues);
        return prevV !== curV;
      }}
    >
      {(formInstance) => {
        if (
          shouldItemHidden ? shouldItemHidden(formInstance, { name }) : false
        ) {
          setHidden(true);
          return null;
        } else {
          setHidden(false);
        }
        return <BasicCell name={name} />;
      }}
    </Form.Item>
  );
}

function AllSelectCheckBox({ disabled }) {
  const { isAllSelected, selectedRowKeys, setAllSelected } = useContext(
    SelectedRowsContext,
  );
  const [checkState, setCheckState] = useState({
    indeterminate: false,
    checked: false,
  });
  useEffect(() => {
    if (isAllSelected) {
      return setCheckState({
        indeterminate: false,
        checked: true,
      });
    }
    if (selectedRowKeys.length > 0) {
      return setCheckState({
        indeterminate: true,
        checked: false,
      });
    }
    setCheckState({
      indeterminate: false,
      checked: false,
    });
  }, [isAllSelected, selectedRowKeys]);

  return (
    <Checkbox
      {...checkState}
      disabled={disabled}
      style={{ marginLeft: 8 }}
      onChange={(e) => {
        const { checked } = e.target;
        setAllSelected(checked);
      }}
    />
  );
}

export default memo(forwardRef(VirtualTable));
