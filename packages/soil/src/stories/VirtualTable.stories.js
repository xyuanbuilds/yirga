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
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: (curColumns = createColumns(100)),
  curColumns,
  dataSource: (longDataSource = createDataSource(1000, curColumns)),
  longDataSource,
};

export const 筛选器 = Template.bind({});
筛选器.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  filters: {
    name0: {
      filters: [{ text: 'test: 2', value: '2' }],
      onFilter: (value, record) => {
        return String(record.name0).includes(value);
      },
    },
    name1: {
      filters: [{ text: 'test: 10', value: '10' }],
      onFilter: (value, record) => {
        return String(record.name1).includes(value);
      },
    },
  },
  dataSource: (normalDataSource = createDataSource(1000, curColumns)),
  normalDataSource,
};
export const 筛选器受控 = Template.bind({});
筛选器受控.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  filters: {
    name0: {
      filters: [{ text: 'test: 2', value: '2' }],
      onFilter: (value, record) => {
        return String(record.name0).includes(value);
      },
      filteredValue: ['2'],
    },
    name1: {
      filters: [{ text: 'test: 10', value: '10' }],
      onFilter: (value, record) => {
        return String(record.name1).includes(value);
      },
    },
  },
  dataSource: (normalDataSource = createDataSource(1000, curColumns)),
  normalDataSource,
};

export const 排序 = Template.bind({});
排序.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  sorters: {
    name2: {
      sorter: (a, b) => a.name1 - b.name1,
    },
  },
  dataSource: normalDataSource,
};

export const 多级排序 = Template.bind({});
多级排序.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  sorters: {
    name0: {
      sorter: {
        compare: (a, b) => a.name0 - b.name0,
        multiple: 1,
      },
      defaultSortOrder: 'ascend',
    },
    name1: {
      sorter: {
        compare: (a, b) => a.name1 - b.name1,
        multiple: 2,
      },
      defaultSortOrder: 'descend',
    },
    name2: {
      sorter: (a, b) => a.name1 - b.name1,
    },
  },
  dataSource: normalDataSource,
};
export const 排序受控 = Template.bind({});
排序受控.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  sorters: {
    name0: {
      sorter: {
        compare: (a, b) => a.name0 - b.name0,
        multiple: 1,
      },
      sortOrder: 'descend',
    },
    name1: {
      sorter: {
        compare: (a, b) => a.name1 - b.name1,
        multiple: 2,
      },
      defaultSortOrder: 'descend',
    },
    name2: {
      sorter: (a, b) => a.name1 - b.name1,
    },
  },
  dataSource: normalDataSource,
};
export const 综合 = Template.bind({});
综合.args = {
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns: curColumns,
  filters: {
    name0: {
      filters: [{ text: 'test: 2', value: '2' }],
      onFilter: (value, record) => {
        return String(record.name0).includes(value);
      },
    },
    name1: {
      filters: [{ text: 'test: 10', value: '10' }],
      onFilter: (value, record) => {
        return String(record.name1).includes(value);
      },
    },
  },
  sorters: {
    name0: {
      sorter: {
        compare: (a, b) => a.name0 - b.name0,
        multiple: 1,
      },
    },
    name1: {
      sorter: {
        compare: (a, b) => a.name1 - b.name1,
        multiple: 2,
      },
      defaultSortOrder: 'descend',
    },
    name2: {
      sorter: (a, b) => a.name1 - b.name1,
    },
  },
  dataSource: normalDataSource,
};
