import React from 'react';
// import { NumberPicker, FormItem } from '@formily/antd';
import 'antd/es/input-number/style/index';
// import { createForm } from '@formily/core';
// import { FormProvider, FormConsumer, Field } from '@formily/react';
import List from '../components/VirtualList/List';
// import FormTest from '../components/Form/test';
import TableFromTest from '../components/Form/TestTableField';

export default {
  title: 'Example/MyTable',
  component: List,
};

// const columns = [
//   {
//     dataIndex: 'a',
//     width: 100,
//     render: (_, __, index) => {
//       return (
//         <Field
//           name={`price_${index}`}
//           title="价格"
//           initialValue={5.2}
//           component={[
//             NumberPicker,
//             {
//               placeholder: '请输入',
//               style: {
//                 width: 100,
//               },
//             },
//           ]}
//         />
//       );
//     },
//   },
//   {
//     dataIndex: 'b',
//     width: 100,
//     render: (_, __, index) => {
//       return (
//         <Field
//           index={index}
//           name={`count_${index}`}
//           title="数量"
//           initialValue={100}
//           component={[
//             NumberPicker,
//             {
//               placeholder: '请输入',
//               style: {
//                 width: 100,
//               },
//             },
//           ]}
//         />
//       );
//     },
//   },
//   {
//     dataIndex: 'c',
//     width: 100,
//     render: (_, __, index) => {
//       return (
//         <FormConsumer>
//           {(form) => (
//             <FormItem>
//               =
//               {` ${
//                 form.values[`price_${index}`] * form.values[`count_${index}`]
//               } 元`}
//             </FormItem>
//           )}
//         </FormConsumer>
//       );
//     },
//   },
// ];

// const form = createForm();
// const Template = (args) => {
//   return (
//     <div style={{ height: 200, width: 300 }}>
//       <FormProvider form={form}>
//         <List {...args} />
//       </FormProvider>
//     </div>
//   );
// };

const Template = () => {
  return (
    <div style={{ height: 600, width: 400 }}>
      <TableFromTest />
    </div>
  );
};
export const Virtualized1 = Template.bind({});
Virtualized1.args = {
  // bordered: false,
  // columns,
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  rowHeight: 45,
  container: {
    height: 500,
    width: 500,
  },
  dataSource: Array(100)
    .fill(1)
    .map((_, index) => ({ a: index, b: index, c: index })),
};
