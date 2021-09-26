import { isArr, isStr, isObj } from './predicate';

type EachArrayIterator<T> = (currentValue: T, key: number) => void | boolean;
type EachStringIterator = (currentValue: string, key: number) => void | boolean;
type EachObjectIterator<T = any> = (
  currentValue: T,
  key: string,
) => void | boolean;
export function each(
  val: string,
  iterator: EachStringIterator,
  revert?: boolean,
): void;
export function each<T>(
  val: T[],
  iterator: EachArrayIterator<T>,
  revert?: boolean,
): void;
export function each<T extends {}, TValue extends T[keyof T]>(
  val: T,
  iterator: EachObjectIterator<TValue>,
  revert?: boolean,
): void;
export function each(val: any, iterator: any, revert?: boolean): void {
  if (isArr(val) || isStr(val)) {
    if (revert) {
      for (let i: number = val.length - 1; i >= 0; i -= 1) {
        if (iterator(val[i], i) === false) {
          return;
        }
      }
    } else {
      for (let i = 0; i < val.length; i += 1) {
        if (iterator(val[i], i) === false) {
          return;
        }
      }
    }
  } else if (isObj(val)) {
    let key: string;
    /* eslint-disable-next-line no-restricted-syntax */
    for (key in val) {
      if (Object.hasOwnProperty.call(val, key)) {
        if (iterator(val[key], key) === false) {
          return;
        }
      }
    }
  }
}
