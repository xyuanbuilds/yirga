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
import { debounce } from 'lodash';
import getStandardRules from './getStandardRules';
import DuplicateFieldsDataContext from './DuplicateCheckContext';
import { SelectedRowsContext } from './index';
import styles from './CustomTable.less';

function VirtualTable(props, ref) {
  const { columns, height, form, lines, rowHeight, ...resetTableProps } = props;
  const [tableWidth, setTableWidth] = useState(0);

  console.log('custom render');

  const dataSource = Array(lines)
    .fill(null)
    .map((_, index) => {
      return {
        key: index + 1,
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
          const fieldName = `${rowIndex + 1}_${curColumn.dataIndex}`;
          const curData =
            curColumn.dataIndex === 'key' || curColumn.dataIndex === 'index'
              ? rawData[rowIndex][curColumn.dataIndex]
              : rawData[rowIndex][fieldName];
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
          <AllSelectCheckBox />
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

function EditableCell({
  title = '',
  fieldName,
  data: curValue,
  renderForm,
  valuePropName,
  handleSave,
  required,
  rule,
  checkDuplicate,
  form,
  line,
}) {
  const save = () => {
    try {
      const value = form.getFieldValue(fieldName);
      const newFieldData = {
        value,
        fieldName,
        line,
      };
      handleSave(newFieldData);
      return newFieldData;
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
      return {};
    }
  };

  return renderForm ? (
    checkDuplicate ? (
      <ItemNeedCheckDuplicate
        name={fieldName}
        renderForm={renderForm}
        save={save}
      />
    ) : (
      <Item
        name={fieldName}
        valuePropName={valuePropName}
        renderForm={renderForm}
        save={save}
        rules={
          rule ||
          (required
            ? [
                {
                  required: true,
                  message: `${title}是必须的`,
                },
              ]
            : undefined)
        }
      />
    )
  ) : (
    curValue
  );
}

function Item({ name, valuePropName, rules, save, renderForm }) {
  const {
    fieldsDataMap,
    collectFieldData,
    form,
    collectFieldValidate,
  } = useContext(DuplicateFieldsDataContext);

  const collectFormValues = debounce(() => {
    const { value, fieldName } = save();
    collectFieldData(fieldName, value);
  }, 300);

  useEffect(() => {
    if (fieldsDataMap[name] === undefined) {
      return form.setFields([
        {
          name,
          value: undefined,
          touched: false,
        },
      ]);
    }
    form.setFieldsValue({
      [name]: fieldsDataMap[name],
    });
    form.validateFields([name]);
  }, [fieldsDataMap, name]);

  useEffect(() => {
    collectFieldValidate({
      name,
      rules: rules || [],
    });
  }, [collectFieldValidate, rules, name]);
  const FormElement = renderForm && renderForm(save);
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
              if (FormElement.props.onChang)
                FormElement.props.onChange(...params);
              collectFormValues();
            },
          })
        : null}
    </Form.Item>
  );
}

function ItemNeedCheckDuplicate({ name, renderForm, save }) {
  const {
    fieldsDataMap,
    collectFieldData,
    form,
    collectFieldValidate,
  } = useContext(DuplicateFieldsDataContext);

  // ! 缓存中有值，说明该表单域已被touched，且有值
  useEffect(() => {
    if (fieldsDataMap[name] === undefined) {
      return form.setFields([
        {
          name,
          value: undefined,
          touched: false,
        },
      ]);
    }
    form.setFieldsValue({
      [name]: fieldsDataMap[name],
    });
    form.validateFields([name]);
  }, [fieldsDataMap, name]);

  const existedFields = useMemo(() => {
    const [curLine, curField] = name.split('_');
    const regForField = new RegExp(`^[0-9]+_${curField}$`);
    const regForSpecial = new RegExp(`^${curLine}_${curField}$`);
    const existed = Object.entries<string>(fieldsDataMap).reduce<string[]>(
      (resArr, cur) => {
        if (regForField.test(cur[0]) && !regForSpecial.test(cur[0])) {
          if (cur[1] !== '' && cur[1] !== undefined) {
            resArr.push(cur[1]);
          }
        }
        return resArr;
      },
      [],
    );

    return existed;
  }, [fieldsDataMap, name]);

  const collectFormValues = debounce(() => {
    const { value, fieldName } = save();
    collectFieldData(fieldName, value);
  }, 300);

  useEffect(() => {
    collectFieldValidate({
      name,
      rules: getStandardRules(
        '请输入字段名！',
        ['', existedFields],
        'tableField',
      ),
    });
  }, [collectFieldValidate, existedFields, name]);

  const FormElement = renderForm && renderForm(collectFormValues);

  return (
    <Form.Item
      preserve={false}
      name={name}
      rules={getStandardRules(
        '请输入字段名！',
        ['', existedFields],
        'tableField',
      )}
    >
      {FormElement
        ? React.cloneElement(FormElement, {
            onChange: (...params) => {
              if (FormElement.props.onChang)
                FormElement.props.onChange(...params);
              collectFormValues();
            },
          })
        : null}
    </Form.Item>
  );
}

function AllSelectCheckBox() {
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
      style={{ marginLeft: 8 }}
      onChange={(e) => {
        const { checked } = e.target;
        setAllSelected(checked);
      }}
    />
  );
}

export default memo(forwardRef(VirtualTable));
