/* eslint-disable import/prefer-default-export */
import { validateRules } from 'rc-field-form/es/utils/validateUtil';

const getValidator = (validator: any) => {
  return (name: string, value: any) => {
    const nameArr = name.split(',');
    return validateRules(nameArr, value, validator, {}, false, {
      label: name,
      name,
    });
  };
};

export { getValidator };
