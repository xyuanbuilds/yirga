1. ~~表格容器过宽，表头自适应，表身如何处理：~~
   1. ~~antd 部分，所有列提供 width，操作列不设置width；~~
   2. ~~表身部分，操作列按照提供的操作数设置固定宽度，所有列不得 ellipsis，操作列宽度固定后，按照最大可用宽，计算其他列宽是否需要增减；~~
2. ~~表格选中逻辑~~
3. ~~虚拟滚动中，根据 initialValue 提前生成 fields；~~
4. ~~表单validate~~：
   1. ~~form.validateFields；~~
   2. ~~错误获取，并scroll到错误位置；~~
      1. ~~rowHeight 获取；~~
      2. validate 中包含行信息； // TODO 看后续反馈
5. 列重名，feedback 添加；
6. 样式补充；
7. 可进行操作动作配置；
8. ~~form 实例外部管理；~~
9.  ~~设计获取&设置表单值：~~
   1. form.getFieldsValue;
      1. ~~form.validateFields;~~
   2. form.setFieldsValue; // TODO 看后续反馈
10. Field disabled & visible；
   3. disabled/visible 阻断 validate
11. ~~index 列~~；
12. ~~行拖拽~~；
   4. ~~手柄拖拽~~
13. ~~表头滚动联动~~；