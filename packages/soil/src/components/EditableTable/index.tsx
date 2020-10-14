/* eslint-disable no-continue */
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import { Row, Col, Button, Form, Divider, Checkbox } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { TableProps, ColumnType } from 'antd/lib/table';
// import { FormInstance } from 'antd/lib/form';
import { omit, throttle, cloneDeep } from 'lodash';
import Table from './CustomTable';
import { drop, swap, isSimilar } from './utils';
import DuplicateCheckContext from './DuplicateCheckContext';

import styles from './index.less';

export interface CustomColumnProps<RecordType>
  extends Omit<ColumnType<RecordType>, 'title' | 'ellipsis' | 'render'> {
  title: string;
  skipCheckEmpty?: boolean;
  rule?: any;
  required?: boolean;
  renderForm?: (save: any) => React.ReactNode;
  render?: (
    data: any,
    record: RecordType,
    index: number,
    isLastLine: boolean,
  ) => React.ReactNode;
  valuePropName?: string;
  handleSave?: (params: unknown) => void;
  // 重复数据检测
  checkDuplicate?: boolean;
  checkFunction?: (fields: any[]) => void;
  forCheckDuplicate?: any[];
}

export interface EditableTableProps<RecordType>
  extends Omit<TableProps<RecordType>, 'columns'> {
  columns?: CustomColumnProps<RecordType>[];
  initialValues?: any[];
  onValuesChange?: (values: any[]) => void;
  disabled?: boolean;
  height: number;
  // onFinish?: () => void;
  // forceValidate?: boolean;
}

const INITIAL_EMPTY = [{}, {}, {}];

function diffInitial(originColumns, initialValues) {
  if (!Array.isArray(initialValues) || initialValues.length === 0) return [];
  const fields = originColumns
    .filter((i) => i.dataIndex !== 'key' && i.dataIndex !== 'index')
    .map((i) => i.dataIndex);

  const diffed = initialValues.map((initialLine, index) => {
    const line = index + 1;
    const lineFieldsData = fields.reduce((res, field) => {
      res[`${line}_${field}`] = initialLine[field] || undefined;
      return res;
    }, {} as Record<string, unknown>);
    lineFieldsData.index = line;
    lineFieldsData.key = line;
    return lineFieldsData;
  });
  console.log('diffed initial form data', diffed);
  return diffed;
}

function diffFormRes(dataSource: Record<string, unknown>[]) {
  return dataSource.map((lineFieldsData) => {
    return Object.fromEntries(
      Object.entries(lineFieldsData).reduce((res, curPair) => {
        if (curPair[0] === 'key' || curPair[0] === 'index') return res;
        res.push([curPair[0].replace(/^\d+_/, ''), curPair[1]]);
        return res;
      }, [] as [string, unknown][]),
    );
  });
}

function diffDataSourceToFieldsData(dataSource: Record<string, unknown>[]) {
  const newCache = dataSource.reduce((cacheRes, lineFieldsData) => {
    for (const key in lineFieldsData) {
      if (
        lineFieldsData[key] !== undefined &&
        key !== 'key' &&
        key !== 'index'
      ) {
        cacheRes[key] = lineFieldsData[key];
      }
    }
    return cacheRes;
  }, {} as Record<string, unknown>);

  return newCache;
}

const EditableTable = (
  {
    columns: originColumns = [],
    className,
    initialValues = INITIAL_EMPTY,
    onValuesChange,
    dataSource: dataSourceControlled,
    disabled = false,
    height,
    ...reset
  }: EditableTableProps<any>,
  ref,
) => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<any[]>([]);

  const basicTableHeight = useMemo(() => {
    return height - (28 + 12);
  }, [height]);

  const preInitialData = useRef<{
    preOriginInitial: any[];
    preInitial: any[];
  }>({
    preOriginInitial: [],
    preInitial: [],
  });
  const initialData = useMemo(() => {
    const res = diffInitial(originColumns, initialValues);
    const pre = preInitialData.current.preInitial;

    for (let n = 0; n < res.length; n++) {
      if (!isSimilar(res[n], pre[n])) {
        preInitialData.current = {
          preOriginInitial: initialValues,
          preInitial: res,
        };
        return res;
      }
    }
    return pre;
  }, [initialValues, originColumns]);

  // *当前表单中的所有真实值
  const [fieldsDataMap, setFieldsData] = useState({});

  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(diffFormRes(dataSource));
    }
  }, [fieldsDataMap, onValuesChange]);

  const collectFieldData = useCallback((fieldName: string, data: unknown) => {
    setFieldsData((v) => ({ ...v, [fieldName]: data }));
  }, []);

  const resetForm = () => {
    setDataSource(() => {
      setFieldsData(diffDataSourceToFieldsData(initialData));
      return cloneDeep(initialData);
    });
  };
  const onFinish = async () => {
    await form.validateFields();
    const formData = diffFormRes(dataSource);
    return formData;
  };

  useEffect(() => {
    resetForm();
  }, [initialData]);
  useImperativeHandle(
    ref,
    () => ({
      onFinish,
      resetForm,
    }),
    [fieldsDataMap, initialData],
  );

  // * basic save 存值，但不刷新表格
  const handleSave = useCallback(({ value, fieldName, line }) => {
    setDataSource((v) => {
      // ? 需要确定稳定性
      v[line - 1] = { ...v[line - 1], [fieldName]: value };
      return v;
    });
  }, []);

  // done
  const addLine = useCallback(
    throttle(() => {
      // TODO 需要虚拟滚动到添加后到位置
      setDataSource((curDataSource) => {
        const curLine = curDataSource.length + 1;
        const fields = Object.fromEntries(
          Object.entries(omit(initialData[0], ['key', 'index'])).map((item) => {
            return [`${curLine}_${item[0].replace(/^\d+_/, '')}`, undefined];
          }),
        );
        return curDataSource.concat({
          index: curLine,
          key: curLine,
          ...fields,
        });
      });
    }, 800),
    [initialData],
  );

  // done
  const exchangeLine = useCallback((index, type) => {
    if (type === 'up') {
      setDataSource((v) => {
        const newData = [...swap(v, index, index - 1)];
        const cacheForUpdate = { ...newData[index], ...newData[index - 1] };
        setFieldsData((cache) => {
          return Object.fromEntries(
            Object.entries({
              ...cache,
              ...cacheForUpdate,
            }).filter(
              (i) => i[1] !== undefined && i[0] !== 'key' && i[0] !== 'index',
            ),
          );
        });
        return newData;
      });
    } else {
      setDataSource((v) => {
        const newData = [...swap(v, index, index + 1)];
        const cacheForUpdate = { ...newData[index], ...newData[index + 1] };
        setFieldsData((cache) => {
          return Object.fromEntries(
            Object.entries({
              ...cache,
              ...cacheForUpdate,
            }).filter(
              (i) => i[1] !== undefined && i[0] !== 'key' && i[0] !== 'index',
            ),
          );
        });
        return newData;
      });
    }
  }, []);

  const [selectedRowKeys, setSelect] = useState<number[]>([]);

  // done
  const deleteLine = useCallback((index) => {
    setDataSource((curDataSource) => {
      const keep = curDataSource.slice(0, index);
      const willDrop = curDataSource.slice(index + 1, curDataSource.length);
      const newData = keep.concat(drop(willDrop));
      // const cacheForUpdate = newData.reduce((record, curLine) => {
      //   for (const key in curLine) {
      //     if (curLine[key] !== undefined && key !== 'key' && key !== 'index') {
      //       record[key] = curLine[key];
      //     }
      //   }
      //   return record;
      // }, {});
      setFieldsData(diffDataSourceToFieldsData(newData));
      // setFieldsData(cacheForUpdate);
      setSelect((v) => {
        const indexInSelected = v.findIndex((i) => i === index);
        if (indexInSelected !== -1) {
          v.splice(indexInSelected, 1);
          return [...v];
        }
        return v;
      });
      return newData;
    });
  }, []);

  // done
  const actionColumn = useMemo(() => {
    return {
      title: '操作',
      width: 129,
      dataIndex: 'index',
      render(_, __, index, isLast) {
        const first = index === 0;
        const last = isLast;
        return (
          <>
            <ArrowUpOutlined
              className={
                first || disabled ? styles.disableIcon : styles.normalIcon
              }
              disabled={first || disabled}
              onClick={
                first || disabled ? undefined : () => exchangeLine(index, 'up')
              }
            />

            <Divider type="vertical" />
            <ArrowDownOutlined
              className={
                last || disabled ? styles.disableIcon : styles.normalIcon
              }
              disabled={last || disabled}
              onClick={
                last || disabled ? undefined : () => exchangeLine(index, 'down')
              }
            />
            <Divider type="vertical" />
            <DeleteOutlined
              disabled={disabled}
              className={disabled ? styles.disableIcon : styles.normalIcon}
              onClick={disabled ? undefined : () => deleteLine(index)}
            />
          </>
        );
      },
    };
  }, [disabled]);

  const selectColumn = useMemo<CustomColumnProps<any>>(() => {
    return {
      title: '',
      width: 30,
      dataIndex: 'index',
      render: (_, __, index) => (
        <SelectableCell index={index} setSelect={setSelect} />
      ),
    };
  }, []);

  const formattedColumns = useMemo(
    () =>
      [selectColumn].concat(
        originColumns.map((col) => {
          if (!col.renderForm) {
            return col;
          }
          return {
            ...col,
            handleSave,
          };
        }),
        actionColumn,
      ),
    [selectColumn, originColumns, actionColumn],
  );

  const deleteMultipleLines = useCallback((rowKeys) => {
    const sortedIndex = rowKeys.sort((a, b) => a - b);
    setDataSource((preDataSource) => {
      sortedIndex.forEach((deleteIndex, curIndex) => {
        preDataSource.splice(deleteIndex - curIndex, 1);
      });
      const newDataSource = preDataSource.map((fieldsMap, i) => {
        return Object.fromEntries(
          Object.entries(fieldsMap).map((item) => [
            item[0].replace(/^\d+/, String(i + 1)),
            item[1],
          ]),
        );
      });
      // const newCache = newDataSource.reduce((cacheRes, lineFieldsData) => {
      //   for (const key in lineFieldsData) {
      //     if (
      //       key !== 'key' &&
      //       key !== 'index' &&
      //       lineFieldsData[key] !== undefined
      //     ) {
      //       cacheRes[key] = lineFieldsData[key];
      //     }
      //   }
      //   return cacheRes;
      // }, {} as Record<string, unknown>);
      setFieldsData(diffDataSourceToFieldsData(newDataSource));
      return newDataSource;
    });
  }, []);

  const deleteLines = () => {
    deleteMultipleLines(selectedRowKeys);
    setSelect([]);
  };

  return (
    <div className={className}>
      <Row className={styles.buttonBar}>
        <Col flex="1">
          <Button type="primary" disabled={disabled} onClick={addLine}>
            添加字段
          </Button>
          <Button
            danger
            disabled={disabled || selectedRowKeys.length === 0}
            onClick={deleteLines}
          >
            删除
          </Button>
          <Button onClick={onFinish}>获取</Button>
          <Button onClick={resetForm}>重置</Button>
        </Col>
      </Row>
      <Row>
        <Col flex="1" className={styles.tableWrapper}>
          <Form component={false} form={form}>
            <DuplicateCheckContext.Provider
              value={{
                // existedFieldsCache,
                form,
                fieldsDataMap,
                collectFieldData,
              }}
            >
              <Table
                {...reset}
                // TODO 重做列选中
                // rowSelection={rowSelection}
                height={basicTableHeight}
                form={form}
                columns={formattedColumns}
                lines={dataSource.length}
              />
            </DuplicateCheckContext.Provider>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

function SelectableCell({ setSelect, index }) {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setSelect((selectedRowKeys) => {
      if (selectedRowKeys.findIndex((i) => i === index) !== -1)
        setChecked(true);
      return selectedRowKeys;
    });
  }, []);
  const onChange = (e) => {
    const { checked: eventValue } = e.target;
    setChecked(() => {
      setSelect((v) => {
        const lineIndex = v.findIndex((i) => i === index);
        // console.log('lineIndex', lineIndex, eventValue, index);
        if (eventValue) {
          if (lineIndex !== -1) return v;
          return [...v, index];
        } else {
          if (lineIndex === -1) return v;
          v.splice(lineIndex, 1);
          return [...v];
        }
      });
      return eventValue;
    });
  };
  return <Checkbox checked={checked} onChange={onChange} />;
}

export default memo(forwardRef(EditableTable));
