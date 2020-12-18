/* eslint-disable no-continue,prefer-promise-reject-errors */
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
  useImperativeHandle,
  forwardRef,
  useRef,
  createContext,
  useContext,
} from 'react';
import { Row, Col, Button, Form, Divider, Checkbox } from 'antd';
/* eslint-disable import/no-extraneous-dependencies */
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { validateRules } from 'rc-field-form/es/utils/validateUtil';
/* eslint-disable import/no-extraneous-dependencies */
import { TableProps, ColumnType } from 'antd/lib/table';
import { throttle, cloneDeep } from 'lodash';
import getStandardRules from './getStandardRules';
import Table from './CustomTable';
import { drop, swap, isSimilar, allPromiseFinish } from './utils';
import DuplicateCheckContext from './DuplicateCheckContext';
import styles from './index.less';

const TABLE_HEADER_HEIGHT = 48;
const ROW_HEIGHT = 53;
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
  onChange?: () => void;
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
  return diffed;
}

function diffColumnRule(
  column: CustomColumnProps<any>,
  dataSource: Record<string, unknown>[],
  line: number,
) {
  const { rule, required, checkDuplicate, dataIndex: name, title } = column;
  let curRule =
    rule ||
    (required
      ? [
          {
            required: true,
            message: `${title}是必须的`,
          },
        ]
      : undefined);
  if (checkDuplicate) {
    const existedFields = dataSource.reduce((res, cur, index) => {
      if (index + 1 === line) return res;
      res.push(cur[String(name)]);
      return res;
    }, [] as unknown[]);
    curRule = getStandardRules(
      '请输入字段名！',
      ['', existedFields],
      'tableField',
    );
  }
  return {
    name: `${line}_${name}`,
    rules: curRule || [],
  };
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

const SelectedRowsContext = createContext({
  selectedRowKeys: [] as number[],
  isAllSelected: false,
  setAllSelected: (p: boolean) => {
    console.log(p);
  },
});

export { SelectedRowsContext };
const EditableTable = (
  {
    columns: originColumns = [],
    initialValues = INITIAL_EMPTY,
    onValuesChange,
    onChange,
    dataSource: dataSourceControlled,
    disabled = false,
    height,
    ...reset
  }: EditableTableProps<any>,
  ref,
) => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<any[]>([]);
  const gridRef = useRef<{ scrollTo: ({ scrollTop: number }) => void }>();

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

  console.log('index render');
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

  const resetForm = (resetData?) => {
    const forReset = resetData || initialData;
    setDataSource(() => {
      setFieldsData(diffDataSourceToFieldsData(forReset));
      return cloneDeep(forReset);
    });
  };

  const fieldValidate = (column, value) => {
    const promise = validateRules(
      [column.name],
      value,
      column.rules,
      { validateMessages: {} },
      false,
      { label: column.label },
    );
    promise.catch((e) => e);
    return promise;
  };

  const validateColumns = useRef({});
  const validateAll = () => {
    const promiseList: Promise<{
      name: string;
      line: number;
      errors: string[];
    }>[] = [];
    dataSource.forEach((lineFields) => {
      for (const key in lineFields) {
        if (key === 'key' || key === 'index') continue;
        const gap = key.indexOf('_');
        const line = Number(key.slice(0, gap));
        // const fieldName = key.slice(gap + 1);
        const curColumn = validateColumns.current[key];
        // console.log('get curColumn', curColumn);
        if (!curColumn || !curColumn.rules || !curColumn.rules.length) continue;
        const promise = fieldValidate(curColumn, lineFields[key]);
        promiseList.push(
          promise
            .then(() => ({ name: key, errors: [], line }))
            .catch((errors) =>
              Promise.reject({
                name: key,
                errors,
                line,
              }),
            ),
        );
      }
    });

    return allPromiseFinish(promiseList)
      .then(() => {
        return Promise.resolve(diffFormRes(dataSource));
      })
      .catch(
        (
          results: {
            name: string;
            line: number;
            errors: string[];
          }[],
        ) => {
          const errorList = results.filter(
            (result) => result && result.errors.length,
          );
          return Promise.reject({
            values: diffFormRes(dataSource),
            errorFields: errorList,
          });
        },
      );
  };
  const onFinish = async () => {
    try {
      diffRules();
      await form.validateFields();
      const formData = await validateAll();
      return formData;
    } catch (e) {
      // console.log('finish get error', e);
      const { errorFields } = e;
      const line =
        errorFields[0].line ||
        Number(
          errorFields.reduce((res, cur) => {
            const lineNum = Number(cur.name[0].split('_')[0]);
            if (lineNum < res) return lineNum;
            return res;
          }, dataSource.length),
        );
      scrollToLine(line);
      form.validateFields();
      throw new Error('编辑信息异常！');
    }
  };
  function scrollToLine(line: number, paramDataSource?: unknown[]) {
    const actualDataSource = paramDataSource || dataSource;
    const maxScrollTop =
      actualDataSource.length * ROW_HEIGHT -
      (basicTableHeight - TABLE_HEADER_HEIGHT);
    const curScrollTop = (line - 1) * ROW_HEIGHT;
    if (gridRef.current) {
      gridRef.current.scrollTo({
        scrollTop: curScrollTop >= maxScrollTop ? maxScrollTop : curScrollTop,
      });
    }
  }

  function diffRules(paramInitialData?) {
    // console.log('for diff', dataSource);
    const forDiff = paramInitialData || dataSource;
    const needRuleColumn = originColumns.filter(
      (i) => i.rule || i.checkDuplicate || i.required,
    );
    forDiff.forEach((_, index) => {
      needRuleColumn.forEach((curColumn) => {
        const res = diffColumnRule(curColumn, forDiff, index + 1);
        validateColumns.current[res.name] = res;
      });
    });
  }

  useEffect(() => {
    resetForm();
    diffRules(initialData);
  }, [initialData]);
  useImperativeHandle(
    ref,
    () => ({
      onFinish,
      resetForm,
    }),
    [fieldsDataMap, initialData, dataSource],
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
      setDataSource((curDataSource) => {
        const curLine = curDataSource.length + 1;
        const newLineFieldsData = Object.fromEntries(
          Object.entries(initialData[0]).map((item) => {
            if (item[0] === 'key' || item[0] === 'index')
              return [item[0], curLine];
            return [`${curLine}_${item[0].replace(/^\d+_/, '')}`, undefined];
          }),
        );
        const newDataSource = curDataSource.concat(newLineFieldsData);
        scrollToLine(newDataSource.length, newDataSource);
        return newDataSource;
      });
    }, 800),
    [initialData, basicTableHeight],
  );

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

  const setAllSelected = useCallback(
    (selectedAll: boolean) => {
      if (!selectedAll) {
        return setSelect([]);
      }
      setSelect(dataSource.map((_, index) => index));
    },
    [dataSource],
  );
  const selectedRowsContextValue = useMemo(() => {
    return {
      selectedRowKeys,
      isAllSelected:
        selectedRowKeys.length === dataSource.length &&
        selectedRowKeys.length > 0,
      setAllSelected,
    };
  }, [selectedRowKeys, dataSource]);

  const deleteLine = useCallback((index) => {
    setDataSource((curDataSource) => {
      const keep = curDataSource.slice(0, index);
      const willDrop = curDataSource.slice(index + 1, curDataSource.length);
      const newData = keep.concat(drop(willDrop));
      setFieldsData(diffDataSourceToFieldsData(newData));
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

  const actionColumn = useMemo<CustomColumnProps<any>>(() => {
    return {
      title: '操作',
      width: 109,
      dataIndex: 'index',
      align: 'center',
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
  }, [disabled, onChange]);

  const selectColumn = useMemo<CustomColumnProps<any>>(() => {
    return {
      title: 'SELECT_COLUMN',
      width: 38,
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
      setFieldsData(diffDataSourceToFieldsData(newDataSource));
      return newDataSource;
    });
  }, []);

  const deleteLines = () => {
    deleteMultipleLines(selectedRowKeys);
    setSelect([]);
  };

  const collectFieldValidate = useCallback((column) => {
    validateColumns.current = {
      ...validateColumns.current,
      [column.name]: column,
    };
  }, []);

  const contextValue = useMemo(() => {
    return {
      form,
      fieldsDataMap,
      collectFieldData,
      collectFieldValidate,
    };
  }, [fieldsDataMap]);

  return (
    <div className={styles.wrapper}>
      <Row className={styles.buttonBar}>
        <Col flex="1">
          <Button
            type="primary"
            disabled={disabled}
            onClick={() => {
              if (onChange) onChange();
              addLine();
            }}
          >
            添加字段
          </Button>
          <Button
            danger
            disabled={disabled || selectedRowKeys.length === 0}
            onClick={() => {
              if (onChange) onChange();
              deleteLines();
            }}
          >
            删除
          </Button>
          <Button onClick={() => onFinish()}>获取</Button>
          <Button onClick={() => resetForm()}>重置</Button>
        </Col>
      </Row>
      <div className={styles.tableWrapper}>
        <Form component={false} form={form}>
          <SelectedRowsContext.Provider value={selectedRowsContextValue}>
            <DuplicateCheckContext.Provider value={contextValue}>
              <Table
                {...reset}
                ref={gridRef}
                height={basicTableHeight}
                rowHeight={ROW_HEIGHT}
                form={form}
                columns={formattedColumns}
                lines={dataSource.length}
              />
            </DuplicateCheckContext.Provider>
          </SelectedRowsContext.Provider>
        </Form>
      </div>
    </div>
  );
};

function SelectableCell({ setSelect, index }) {
  const { selectedRowKeys } = useContext(SelectedRowsContext);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (selectedRowKeys.findIndex((i) => i === index) !== -1) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [selectedRowKeys, index]);
  const onChange = useCallback((e) => {
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
  }, []);
  return (
    <div className={styles.selectBoxWrapper}>
      <Checkbox checked={checked} onChange={onChange} />
    </div>
  );
}

export default memo(forwardRef(EditableTable));
