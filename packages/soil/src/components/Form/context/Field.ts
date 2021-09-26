import { useContext, createContext } from 'react';
import type { GeneralField } from '../types/Field';

const FieldContext = createContext<GeneralField>(null!);

export const useField = <T = GeneralField>(): T => {
  return useContext(FieldContext) as any;
};

export default FieldContext;
