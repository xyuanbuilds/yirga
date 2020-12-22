import React from 'react';
import Table from '../components/VirtualTable';

export default {
  title: 'Example/MyTable',
  component: Table,
};

const Template = (args) => {
  return (
    <div style={{ height: args.height, width: args.width }}>
      <Table {...args} />
    </div>
  );
};

const createColumns = (num) => {
  return Array(num)
    .fill({})
    .map((i, index) => ({ key: `name${index}` }));
};

const createDataSource = (num, columns) => {
  return Array(num)
    .fill(null)
    .map((i, lineIndex) => {
      const curData = columns
        .map((column) => column.key)
        .reduce((pre, cur) => {
          pre[cur] = '';
          return pre;
        }, {});
      Object.keys(curData).forEach((key) => {
        curData[key] = lineIndex;
      });
      return curData;
    });
};

export const Virtualized = Template.bind({});
let curColumns;
let normalDataSource;
let longDataSource;
Virtualized.args = {
  // bordered: false,
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: (curColumns = createColumns(100)),
  curColumns,
  dataSource: (longDataSource = createDataSource(1000, curColumns)),
  longDataSource,
};
export const 列边界 = Template.bind({});
let curColumns1;
let curDataSource1;
列边界.args = {
  // bordered: false,
  height: 488 + 2, // TODO 容器监听
  width: 120 * 5 + 1, // TODO 容器监听
  columns: (curColumns1 = createColumns(5)),
  curColumns,
  dataSource: (curDataSource1 = createDataSource(100, curColumns1)),
  curDataSource1,
};
export const 行边界 = Template.bind({});
const curColumns2 = createColumns(100).map((i, index) => {
  if (index === 1) i.className = 'testCol';
  return i;
});
let curDataSource2;

行边界.args = {
  // bordered: false,
  height: 48 * 6 + 1, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns2,
  dataSource: (curDataSource2 = createDataSource(5, curColumns2)),
  rowClassName: (_, index) => (index === 1 ? 'rowTest' : undefined),
  curDataSource2,
};

// export const 筛选器 = Template.bind({});
// 筛选器.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   filters: {
//     name0: {
//       filters: [{ text: 'test: 2', value: '2' }],
//       onFilter: (value, record) => {
//         return String(record.name0).includes(value);
//       },
//     },
//     name1: {
//       filters: [{ text: 'test: 10', value: '10' }],
//       onFilter: (value, record) => {
//         return String(record.name1).includes(value);
//       },
//     },
//   },
//   dataSource: (normalDataSource = createDataSource(1000, curColumns)),
//   normalDataSource,
// };
// export const 筛选器受控 = Template.bind({});
// 筛选器受控.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   filters: {
//     name0: {
//       filters: [{ text: 'test: 2', value: '2' }],
//       onFilter: (value, record) => {
//         return String(record.name0).includes(value);
//       },
//       filteredValue: ['2'],
//     },
//     name1: {
//       filters: [{ text: 'test: 10', value: '10' }],
//       onFilter: (value, record) => {
//         return String(record.name1).includes(value);
//       },
//     },
//   },
//   dataSource: (normalDataSource = createDataSource(1000, curColumns)),
//   normalDataSource,
// };

// export const 排序 = Template.bind({});
// 排序.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   sorters: {
//     name2: {
//       sorter: (a, b) => a.name1 - b.name1,
//     },
//   },
//   dataSource: normalDataSource,
// };

// export const 多级排序 = Template.bind({});
// 多级排序.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   sorters: {
//     name0: {
//       sorter: {
//         compare: (a, b) => a.name0 - b.name0,
//         multiple: 1,
//       },
//       defaultSortOrder: 'ascend',
//     },
//     name1: {
//       sorter: {
//         compare: (a, b) => a.name1 - b.name1,
//         multiple: 2,
//       },
//       defaultSortOrder: 'descend',
//     },
//     name2: {
//       sorter: (a, b) => a.name1 - b.name1,
//     },
//   },
//   dataSource: normalDataSource,
// };
// export const 排序受控 = Template.bind({});
// 排序受控.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   sorters: {
//     name0: {
//       sorter: {
//         compare: (a, b) => a.name0 - b.name0,
//         multiple: 1,
//       },
//       sortOrder: 'descend',
//     },
//     name1: {
//       sorter: {
//         compare: (a, b) => a.name1 - b.name1,
//         multiple: 2,
//       },
//       defaultSortOrder: 'descend',
//     },
//     name2: {
//       sorter: (a, b) => a.name1 - b.name1,
//     },
//   },
//   dataSource: normalDataSource,
// };
// export const 综合 = Template.bind({});
// 综合.args = {
//   height: 488 + 2, // TODO 容器监听
//   width: 1000, // TODO 容器监听
//   columns: curColumns,
//   filters: {
//     name0: {
//       filters: [{ text: 'test: 2', value: '2' }],
//       onFilter: (value, record) => {
//         return String(record.name0).includes(value);
//       },
//     },
//     name1: {
//       filters: [{ text: 'test: 10', value: '10' }],
//       onFilter: (value, record) => {
//         return String(record.name1).includes(value);
//       },
//     },
//   },
//   sorters: {
//     name0: {
//       sorter: {
//         compare: (a, b) => a.name0 - b.name0,
//         multiple: 1,
//       },
//     },
//     name1: {
//       sorter: {
//         compare: (a, b) => a.name1 - b.name1,
//         multiple: 2,
//       },
//       defaultSortOrder: 'descend',
//     },
//     name2: {
//       sorter: (a, b) => a.name1 - b.name1,
//     },
//   },
//   dataSource: normalDataSource,
// };
