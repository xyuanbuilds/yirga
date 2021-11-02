import { getStandardRules } from './test';

const tableList = ['123', '321'];
const validator1 = getStandardRules('test1', ['', tableList], 'tableField');
validator1[2].warningOnly = true;

const validator2 = getStandardRules(
  'test2',
  ['', ['aaa', 'bbb']],
  'tableField',
);

export { validator1, validator2 };
