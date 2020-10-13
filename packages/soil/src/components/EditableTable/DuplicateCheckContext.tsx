import { createContext } from 'react';

const DuplicateFieldsDataContext = createContext({
  form: {} as import('antd/lib/form').FormInstance,
  fieldsDataMap: {}, // 已经 touched 后的字段值缓存
  collectFieldData: (fieldName: string, data?: unknown) => {
    console.log(fieldName, data);
  },
});

export default DuplicateFieldsDataContext;
