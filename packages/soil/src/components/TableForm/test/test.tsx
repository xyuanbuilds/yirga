/* eslint no-useless-escape:0 */
const IP_REG = /^(?:(?:1[0-9][0-9]\.)|(?:2[0-4][0-9]\.)|(?:25[0-5]\.)|(?:[1-9][0-9]\.)|(?:[0-9]\.)){3}(?:(?:1[0-9][0-9])|(?:2[0-4][0-9])|(?:25[0-5])|(?:[1-9][0-9])|(?:[0-9]))$/;
const URL_REG = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/g;
// 质量探查字段类型正则表达式
// eslint-disable-next-line @typescript-eslint/naming-convention
const FieldTypeRegExp = {
  intRegExp: /smallint|int|bigint|integer|decimal|numeric|smallserial|bigserial|real|float|double|double precision/,
  intDecimalRegExp: /numeric|real|float|double|double precision/,
  strRegExp: /char|character|varchar|character varing|text|string/,
  timeRegExp: /date|time|timestamp|timez|timestampz/,
};

/**
 * 检测是否是一串URL
 * @param {string} path
 */
const isUrl = (path) => URL_REG.test(path);

// 加上节流之后会有白屏报错
const ipTest = {
  validator: function handleValidate(rule, value) {
    if (!value) {
      return Promise.resolve();
    }
    if (!value.match(IP_REG)) {
      // eslint-disable-line
      return Promise.reject(new Error('ip格式不正确'));
    }
    return Promise.resolve();
  },
};

/**
 * 常用正则表达式
 * @attribute tbName - 表名校验规则，适用于所有模块的表名
 * @attribute lifeCycle - 结合 inputNumber 控件使用
 */
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
  genericName: {
    /**
     * 名称命名规范校验
     * 注：括号包括中英文的大中小括号
     */
    pattern: /^(?!.*[/\s%￥$?？\(\)\[\]\{\}\（\）\【\】])/g,
    message: '不支持 %￥$?/空格括号字符',
  },

  /**
   * 表描述和字段注释校验
   */
  fieldComment: {
    pattern: /^([^\\;'-]|-(?!-))*$/, // 支持"-"但不支持"--"
    message: "不支持 ' ; -- \\符号",
  },
};

const DBTYPE_MAP_JSON = {
  // 数据格式[[表名, 字段名, 表名校验, 字段名校验], [表注释, 字段注释, 表注释校验, 字段注释校验]]
  default: [
    [63, 63, null, null],
    [null, null, null, null],
  ],
  oracle: [
    [30, 30, null, null],
    [
      null,
      null,
      null,
      { pattern: /^([^\\&%;'-]|-(?!-))*$/, message: "不支持& % ' ; -- \\符号" },
    ],
  ],
  uxdb: [
    [54, 63, null, null],
    [null, null, null, null],
  ],
  dameng: [
    [
      63,
      63,
      {
        pattern: /^[a-zA-Z_][\da-zA-Z_]*$/g,
        message: '只支持非数字开头的大小写字母、数字、下划线',
      },
      {
        pattern: /^[a-zA-Z_][\da-zA-Z_]*$/g,
        message: '只支持非数字开头的大小写字母、数字、下划线',
      },
    ],
    [null, null, null, null],
  ],
};

/**
 * @param { string } type 'tableField | comment'
 * @param { string } dbType
 * @param { string } contentType 'table | field'
 * @returns { number }
 */
function getLimitLength(type, dbType, contentType) {
  const typeIndex = type === 'tableField' ? 0 : 1;
  const contentTypeIndex = contentType === 'table' ? 0 : 1;
  const db = DBTYPE_MAP_JSON[dbType] || DBTYPE_MAP_JSON.default;
  return db[typeIndex][contentTypeIndex] || Number.MAX_SAFE_INTEGER;
}

/**
 * @param { string } type 'tableField | comment'
 * @param { string } dbType
 * @param { string } contentType 'table | field'
 * @returns { number }
 */
function getLimitTypeRule(type, dbType, contentType) {
  const defaultRegObj =
    type === 'tableField'
      ? {
          pattern: REGEXP.tbName.pattern,
          message: REGEXP.tbName.message,
        }
      : {
          pattern: REGEXP.fieldComment.pattern,
          message: REGEXP.fieldComment.message,
        };
  const typeIndex = type === 'tableField' ? 0 : 1;
  const contentTypeIndex = contentType === 'table' ? 2 : 3;
  const db = DBTYPE_MAP_JSON[dbType] || DBTYPE_MAP_JSON.default;
  if (!db[typeIndex][contentTypeIndex]) {
    return defaultRegObj;
  }
  return db[typeIndex][contentTypeIndex];
}

/** 通用表单验证规则
 * 支持 非空，特殊字符，重命名 校验
 * @param { string | '' } msg required的文案
 * @param { array } repeatName 重名校验
 * @param { array | string | object} type  [报错信息,自定义正则] | 'tableField|comment' |  ant-Rule对象
 * @param { string } dbType 数据库类型
 * @param { string } contentType 表｜字段类型 'table' | 'field'
 */
// https://shimo.im/docs/yGTJHjdYK8Jp9WJx?tdsourcetag=s_pctim_aiomsg
function getStandardRules(
  msg?: string | '',
  repeatName?: any[],
  type?: any[] | string | object,
  dbType?: string,
  contentType?: string,
): any[];
function getStandardRules(
  msg = '名称不能为空',
  repeatName = [],
  type = [],
  dbType = 'default',
  contentType = 'table',
) {
  let typeRule;
  if (type === 'tableField' || type === 'comment') {
    typeRule = getLimitTypeRule(type, dbType, contentType);
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
        const nameArr = repeatName.find((item) => Array.isArray(item));
        const repeatMsg = repeatName.find((item) => !Array.isArray(item)) || '';
        // 重名校验
        const isSame =
          nameArr !== undefined
            ? nameArr.includes(value)
            : value && repeatName.includes(value); // 禅道bug4606，表数据为空值时提示语有问题
        // 长度校验
        // 产品规则为表名称和字段名称限制63个字符，其他限制128个，遇到中文需要转成两个字符
        const strLength =
          value && typeof value === 'string'
            ? value.replace(/[\u4e00-\u9fa5]/g, 'aa').length
            : 0;
        if (isSame) {
          const errMsg = repeatMsg || '名称已存在, 请重命名';
          return Promise.reject(new Error(errMsg));
        }
        if (type === 'tableField' || type === 'comment') {
          const nameLimitLength = getLimitLength(type, dbType, contentType);
          if (strLength > nameLimitLength) {
            return Promise.reject(new Error(`字符限制${nameLimitLength}个`));
          }
        } else if (strLength > 128) {
          return Promise.reject(new Error('字符限制128个'));
        }
        return Promise.resolve();
      },
    },
  ];
  return typeRule ? [...res, typeRule] : res;
}

export { isUrl, ipTest, REGEXP, FieldTypeRegExp, getStandardRules };
