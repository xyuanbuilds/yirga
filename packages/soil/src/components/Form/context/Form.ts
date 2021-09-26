import { createContext, useContext } from 'react';
import type { Form } from '../types/Form';

const FormContext = createContext<Form>(null!);

export const useForm = <T = Form>(): T => {
  return useContext(FormContext) as any;
};

export default FormContext;
