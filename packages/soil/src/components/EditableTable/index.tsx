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
import { Row, Col, Button, Form, Divider } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { TableProps, ColumnType } from 'antd/lib/table';
// import { FormInstance } from 'antd/lib/form';
import { omit, throttle } from 'lodash';
import Table from './CustomTable';
import { drop, swap, dropMultiple, isSimilar } from './utils';
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
  const fieldsHasInitialValue = Object.entries(initialValues[0]).map(
    (i) => i[0],
  );
  const fieldNeedFillInitialValue = fields.filter(
    (i) => fieldsHasInitialValue.find((field) => field === i) === undefined,
  );

  const diffed = initialValues.map((initialLine, index) => {
    const line = index + 1;
    const actual = Object.fromEntries(
      Object.entries(initialLine)
        .map((item) => {
          const key = item[0];
          const content = item[1];
          return [`${line}_${key}`, content];
        })
        .concat(
          fieldNeedFillInitialValue.map((field) => {
            return [`${line}_${field}`, undefined];
          }),
        ),
    );

    return { index: line, key: line, ...actual };
  });
  // console.log('diffed initial form data', diffed);
  return diffed;
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
  const [selectedRowKeys, setSelect] = useState<string[]>([]);
  const basicTableHeight = useMemo(() => {
    return height - (28 + 12);
  }, [height]);

  const preInitialData = useRef<{
    preColumn: null | Record<string, unknown>;
    preOriginInitial: any[];
    preInitial: any[];
  }>({
    preColumn: null,
    preOriginInitial: [],
    preInitial: [],
  });
  const initialData = useMemo(() => {
    const res = diffInitial(originColumns, initialValues);
    const pre = preInitialData.current.preInitial;

    for (let n = 0; n < res.length; n++) {
      if (!isSimilar(res[n], pre[n])) {
        preInitialData.current = {
          preColumn: originColumns,
          preOriginInitial: initialValues,
          preInitial: res,
        };
        return res;
      }
    }
    return pre;
  }, [initialValues, originColumns]);

  // * 手动重设form展示值（dataSource更新）
  const setFormValues = (data) => {
    const formValuesForSet = data.reduce((r, cur) => ({ ...r, ...cur }), {});
    console.log(formValuesForSet);
    form.setFieldsValue(formValuesForSet);
  };

  // TODO 外部响应需要重写
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(dataSource);
    }
  }, [dataSource, onValuesChange]);

  // const existedFieldsCache = useRef<string[]>([]);
  const [fieldsDataMap, setFieldsData] = useState({});
  useEffect(() => {
    setFieldsData((cache) => {
      const newCache = Object.fromEntries(
        Object.entries(cache).map((i) => {
          return [i[0], i[1] !== undefined ? i[1] : dataSource[i[0]]]; // dataSource的变化以cache为主
        }),
      );
      return newCache;
    });
  }, [dataSource]);

  const collectFieldData = useCallback((fieldName: string, data: unknown) => {
    setFieldsData((v) => ({ ...v, [fieldName]: data }));
  }, []);

  // TODO 需要调整
  const resetForm = useCallback(() => {
    // TODO reset需要调整cache
    setDataSource(() => {
      setFormValues(initialData);
      return initialData;
    });
  }, [initialData]);
  // * 初始值变化重设 dataSource
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const onFinish = useCallback(async () => {
    const res = await form.validateFields();
    return res;
  }, [form]);

  console.log('datasource change', dataSource);

  useImperativeHandle(
    ref,
    () => ({
      onFinish,
      resetForm,
    }),
    [onFinish, resetForm],
  );

  // * basic save
  const handleSave = useCallback(({ value, fieldName, line }) => {
    setDataSource((v) => {
      // ? 需要确定稳定性
      v[line - 1] = { ...v[line - 1], [fieldName]: value };
      // const newData = v.map((data, index) => {
      //   if (index !== line - 1) return data;
      //   return { ...data, [fieldName]: value };
      // });
      return v;
    });
  }, []);

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
        setFormValues(curDataSource);
        return curDataSource.concat({
          index: curLine,
          key: curLine,
          ...fields,
        });
      });
    }, 500),
    [initialData],
  );

  const exchangeLine = useCallback((index, type) => {
    if (type === 'up') {
      setDataSource((v) => {
        const newData = [...swap(v, index, index - 1)];
        setFormValues(newData);
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
        setFormValues(newData);
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

  const deleteLine = useCallback((index) => {
    setDataSource((curDataSource) => {
      const keep = curDataSource.slice(0, index);
      const willDrop = curDataSource.slice(index + 1, curDataSource.length);
      const newData = keep.concat(drop(willDrop));
      const cacheForUpdate = newData.reduce((record, curLine) => {
        for (const key in curLine) {
          console.log(curLine[key]);
          if (curLine[key] !== undefined && key !== 'key' && key !== 'index') {
            record[key] = curLine[key];
          }
        }
        return record;
      }, {});
      setFormValues(newData);
      setFieldsData(cacheForUpdate);
      console.log('cache update', cacheForUpdate);
      return newData;
    });
  }, []);

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
              onClick={() => exchangeLine(index, 'up')}
            />

            <Divider type="vertical" />
            <ArrowDownOutlined
              className={
                last || disabled ? styles.disableIcon : styles.normalIcon
              }
              disabled={last || disabled}
              onClick={() => exchangeLine(index, 'down')}
            />
            <Divider type="vertical" />
            <DeleteOutlined
              disabled={disabled}
              className={disabled ? styles.disableIcon : styles.normalIcon}
              onClick={() => deleteLine(index)}
            />
          </>
        );
      },
    };
  }, [disabled]);

  const formattedColumns = useMemo(
    () =>
      originColumns
        .map((col) => {
          if (!col.renderForm) {
            return col;
          }
          return {
            ...col,
            handleSave,
          };
        })
        .concat(actionColumn),
    [handleSave, originColumns, actionColumn],
  );

  const deleteMultipleLines = useCallback(
    (lines) => {
      const actualIndex = lines
        .sort((a, b) => a - b)
        .map((index, i) => index - i);
      let newDataSource = dataSource;
      actualIndex.forEach((key) => {
        newDataSource = dropMultiple(newDataSource, key);
      });
      setDataSource(newDataSource);
    },
    [dataSource],
  );

  // const rowSelection = {
  //   selectedRowKeys,
  //   onChange: (rowKeys) => setSelect(rowKeys),
  // };

  const deleteLines = useCallback(() => {
    const lines = selectedRowKeys.map((key) => Number(key) - 1);
    deleteMultipleLines(lines);
    setSelect([]);
  }, [selectedRowKeys, deleteMultipleLines]);

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

export default memo(forwardRef(EditableTable));
