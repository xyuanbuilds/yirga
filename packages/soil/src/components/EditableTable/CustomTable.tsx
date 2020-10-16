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
import { Table, Form } from 'antd';
import { debounce } from 'lodash';
import getStandardRules from './getStandardRules';
import DuplicateFieldsDataContext from './DuplicateCheckContext';
import styles from './CustomTable.less';

function VirtualTable(props, ref) {
  const { columns, height, form, lines, ...resetTableProps } = props;
  const [tableWidth, setTableWidth] = useState(0);

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

    return columns.map((column) => {
      if (column.width) {
        return column;
      }
      const widthForUse = Math.floor(
        (tableWidth - widthAlready) / widthColumnCount,
      );
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

  useEffect(() => resetVirtualGrid, [tableWidth]);

  const renderVirtualList = (
    rawData: Record<string, unknown>[],
    { scrollbarSize, ref: innerRef, onScroll }: any,
  ) => {
    innerRef.current = connectObject;
    const totalHeight = rawData.length * 48;

    return (
      <Grid
        ref={gridRef}
        columnCount={mergedColumns.length}
        columnWidth={(index) => {
          const { width } = mergedColumns[index];
          return totalHeight > height - 48 && index === mergedColumns.length - 1
            ? width - scrollbarSize - 1
            : width;
        }}
        height={height - 48}
        rowCount={rawData.length}
        rowHeight={() => 48}
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

  const customComponents = useMemo(() => {
    return {
      body: renderVirtualList,
    };
  }, [mergedColumns]);

  const resizableListener = useCallback(({ offsetWidth }) => {
    setTableWidth(offsetWidth);
  }, []);

  const scroll = useMemo(() => {
    return {
      y: height - 48,
      x: tableWidth,
    };
  }, [height, tableWidth]);

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
  return (
    <Form.Item
      name={name}
      preserve={false}
      valuePropName={valuePropName}
      rules={rules}
    >
      {React.cloneElement(renderForm && renderForm(save), {
        onChange: collectFormValues,
      })}
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

  // * 获取当前重名验证字段的所有值
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

  // *判断重名
  // 1. 有已存在值
  // 2. 当前有内容（不是undefined）
  // useEffect(() => {
  //   if (
  //     existedFields &&
  //     existedFields.length > 0 &&
  //     fieldsDataMap[name] !== undefined
  //   ) {
  //     form.validateFields([name]);
  //   }
  // }, [existedFields]);

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
      {React.cloneElement(renderForm && renderForm(collectFormValues), {
        onChange: collectFormValues,
      })}
    </Form.Item>
  );
}

// function ArrayContentEqual(left: unknown[], right: unknown[]) {
//   const flag = [...left];
//   for (let i = 0; i < right.length; i++) {
//     const curIndex = left.findIndex((item) => item === right[i]);
//     if (curIndex >= 0) {
//       flag.splice(curIndex, 1);
//     } else {
//       return false;
//     }
//   }
//   return true;
// }

export default memo(forwardRef(VirtualTable));
