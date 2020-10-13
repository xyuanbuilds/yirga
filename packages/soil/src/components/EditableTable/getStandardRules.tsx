import React from 'react';

const REGEXP = {
  tbName: {
    // eslint-disable-next-line no-useless-escape
    pattern: /^[a-z_][\da-z_]*$/g,
    message: '只支持非数字开头的小写字母、数字、下划线',
    tooltip: (
      <div>
        <div>支持小写英文字母</div>
        <div>支持数字、下划线，但不能以数字开头</div>
        <div>不支持中文，特殊字符，空格等</div>
      </div>
    ),
  },
  lifeCycle: {
    pattern: /^(-1|[1-9]\d*)$/g,
    message: '只支持-1和正整数',
  },
  // 规则三通用命名校验
  genericName: {
    // 非空 + 中文 + 数字 + 字母 + 下划线
    // pattern: /^[\w\@\.\u4e00-\u9fa5]+$/,
    // message: '只支持中英文、数字、下划线、@、点',
    pattern: /^(?!.*[%￥$?？])/g,
    message: '不支持 %￥$? 字符',
  },
};

/** 通用表单验证规则
 * 支持 非空，特殊字符，重命名 校验
 * @param { string | '' } msg required的文案
 * @param { array } repeatName 重名校验
 * @param { array | string | object} type  自定义正则 | 'tableField'
 */
// https://shimo.im/docs/yGTJHjdYK8Jp9WJx?tdsourcetag=s_pctim_aiomsg
const getStandardRules = (
  msg = '必填项',
  repeatName: any[] = [],
  type: any = [],
) => {
  let typeRule;
  if (type === 'tableField') {
    typeRule = {
      pattern: REGEXP.tbName.pattern,
      message: REGEXP.tbName.message,
    };
  } else if (type.constructor.name === 'Object') {
    if (type.type === 'phone') {
      typeRule = {
        pattern: /^1\d{10}/,
        message: type.message,
      };
    } else {
      typeRule = type;
    }
  } else if (type === 'none') {
    typeRule = null;
  } else {
    // const patternMsg = type.length > 0 ? type[0] : REGEXP.genericName.message;
    // const pattern = type.length > 0 ? type[1] : REGEXP.genericName.pattern;
    typeRule =
      Array.isArray(type) && type.length > 0
        ? {
            pattern: type[1],
            message: type[0],
          }
        : {
            pattern: REGEXP.genericName.pattern,
            message: REGEXP.genericName.message,
          };
  }
  const res = [
    {
      required: msg !== '',
      message: msg,
    },
    {
      validator: function renameValidator(rule, value) {
        const nameArr: string = repeatName.find((item) => Array.isArray(item));
        const repeatMsg = repeatName.find((item) => !Array.isArray(item)) || '';
        // 重名校验
        const isSame =
          nameArr !== undefined
            ? nameArr.includes(value)
            : value && repeatName.includes(value); // 禅道bug4606，表数据为空值时提示语有问题
        // 长度校验
        // 产品规则为表名称和字段名称限制64个字符，其他限制128个，遇到中文需要转成两个字符
        const strLength =
          value && typeof value === 'string'
            ? value.replace(/[\u4e00-\u9fa5]/g, 'aa').length
            : 0;
        if (isSame) {
          const errMsg = repeatMsg || '名称已存在, 请重命名';
          return Promise.reject(new Error(errMsg));
        } else if (type === 'tableField' && strLength > 64) {
          return Promise.reject(new Error('字符限制64个'));
        } else if (strLength > 128) {
          return Promise.reject(new Error('字符限制128个'));
        }
        return Promise.resolve();
      },
    },
  ];
  return typeRule ? [...res, typeRule] : res;
};

export default getStandardRules;
