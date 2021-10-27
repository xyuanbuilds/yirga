import * as React from 'react';

import { toJS } from '@formily/reactive';
import createFrom from './models/Form';
import type { Form } from './types/Form';

class FormStore {
  private form: Form;

  constructor() {
    this.form = createFrom();
  }

  private validateFields = () => {
    this.form.validate();
  };

  private getFieldsValue = async () => {
    try {
      await this.form.validate();
    } catch (e) {
      return [];
    }
    return toJS(this.form.values);
  };

  private resetFields = () => {
    this.form.reset();
  };

  public getForm = () => {
    const formWithOperators = Object.assign(this.form, {
      // getFieldValue: this.getFieldValue,
      getFieldsValue: this.getFieldsValue,
      // getFieldError: this.getFieldError,
      // getFieldWarning: this.getFieldWarning,
      // getFieldsError: this.getFieldsError,
      // isFieldsTouched: this.isFieldsTouched,
      // isFieldTouched: this.isFieldTouched,
      // isFieldValidating: this.isFieldValidating,
      // isFieldsValidating: this.isFieldsValidating,
      resetFields: this.resetFields,
      // setFields: this.setFields,
      // setFieldsValue: this.setFieldsValue,
      validateFields: this.validateFields,
      // submit: this.submit,

      // getInternalHooks: this.getInternalHooks,
    });
    return formWithOperators;
  };
}

export interface FormOperator<Values extends object> {
  getFieldsValue: () => Promise<Values>;
  resetFields: () => void;
  validateFields: () => void;
}

function useForm<Values extends object>(): [Form & FormOperator<Values>] {
  const formRef = React.useRef<Form & FormOperator<Values>>();

  if (!formRef.current) {
    // const forceReRender = () => {
    //   forceUpdate({});
    // };
    const formStore = new FormStore();
    formRef.current = formStore.getForm();
  }

  return [formRef.current];
}

export default useForm;
