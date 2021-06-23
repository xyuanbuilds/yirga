/* eslint-disable */
class EffectModule {
  count = 1;

  message = 'hello!';

  delay(input: Promise<number>, out: Promise<number>) {
    return input.then((i) => ({
      payload: `hello ${i}!`,
      type: 'delay',
    }));
  }

  setMessage(action: any) {
    return {
      payload: action.payload!.getMilliseconds(),
      type: 'set-message',
    };
  }
}
// Function -> (...args: any[]) => unknown
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K; // 生成 { key: T[key]是函数 ? never : key }
}[keyof T]; // 再用 T 原来的 key 去取，获得 转化后 property 的 union 类型，never 被过滤，最终只会返回 T[key] 不是函数的 key

// Omit 掉不是函数掉 property
type EffectModuleOnlyFunctionProperty = Omit<
  EffectModule,
  NonFunctionKeys<EffectModule>
>;
