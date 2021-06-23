type NonPromisify<T> = T extends Promise<infer U> ? U : T;

type MapTypeToNonPromisify<T> = T extends any[]
  ? {
      [K in keyof T]: NonPromisify<T[K]>;
    }
  : NonPromisify<T>;

type NoNPromiseFunc<F> = F extends (...args: infer P) => infer T
  ? (...args: MapTypeToNonPromisify<P>) => MapTypeToNonPromisify<T>
  : never;

// test type
type FunctionPropertiesObj = {
  delay: (
    input: Promise<number>,
    out: Promise<number>,
  ) => Promise<{
    payload: string;
    type: string;
  }>;
  setMessage: (
    action: Date,
  ) => {
    payload: number;
    type: string;
  };
};
type NoNPromiseFuncObj<T> = { [K in keyof T]: NoNPromiseFunc<T[K]> };

type UnPacked = NoNPromiseFuncObj<FunctionPropertiesObj>;
