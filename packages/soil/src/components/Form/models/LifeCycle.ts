import { batch } from '@formily/reactive';
import { isStr, isFn, isArr } from '../predicate';
import LC from '../effects/constants';

import type { Form } from '../types/Form';
import type { GeneralField, Segment } from '../types/Field';
import type {
  LifeCycle,
  FieldLifeCycle,
  LifeCycleCallBack,
  FieldLifeCycleCallBack,
  Heart,
} from '../types/Effects';

const EFFECT_STATE: {
  lifecycles: (LifeCycle<any> | FieldLifeCycle)[];
  effectStart: boolean;
  effectEnd: boolean;
} = {
  lifecycles: [],
  effectStart: false,
  effectEnd: false,
};

type ExtraPayload = object | undefined;

// * payload 为表单体内额外提供的内容
function createFormLifeCycle<Payload extends ExtraPayload>(
  type: string,
  cb: (form: Form, payload?: Payload) => void,
): LifeCycle<Payload> {
  function listener(form: Form, curType: string, payload?: Payload) {
    if (curType === type) {
      cb(form, payload);
    }
  }

  return {
    notify(notifyType: string, payload: Payload, form: Form) {
      listener(form, notifyType, payload);
    },
  };
}

// * 填充生命周期 type, 等待 callback
function initFormLifeCycle<Payload extends ExtraPayload = undefined>(
  type: string,
) {
  return (callback: LifeCycleCallBack<Payload>) => {
    if (EFFECT_STATE.effectStart) {
      EFFECT_STATE.lifecycles.push(
        createFormLifeCycle<Payload>(type, (form, payload) =>
          batch(() => {
            callback(form, payload);
          }),
        ),
      );
    }
  };
}

function createFieldLifeCycle<Payload extends ExtraPayload = undefined>(
  type: string,
  cb: (field: GeneralField, form: Form, payload?: Payload) => void,
): FieldLifeCycle {
  function listener(field: GeneralField, form: Form, curType: string) {
    if (curType === type) {
      cb(field, form);
    }
  }

  return {
    notify(notifyType: string, field: GeneralField, ctx: Form) {
      // if (isStr(notifyType)) {
      listener(field, ctx, notifyType);
      // }
    },
  };
}

function initFieldLifeCycle<Payload extends ExtraPayload = undefined>(
  type: string,
) {
  return (
    fieldPattern: Segment | Segment[],
    callback: FieldLifeCycleCallBack<Payload>,
  ) => {
    if (EFFECT_STATE.effectStart) {
      EFFECT_STATE.lifecycles.push(
        createFieldLifeCycle<Payload>(type, (field, form, payload) => {
          if (isCurField(fieldPattern, field.identifier))
            batch(() => {
              callback(field, form, payload);
            });
        }),
      );
    }
  };
}
function isCurField(l: Segment | Segment[], r: string) {
  if (isArr(l)) {
    return l.toString() === r;
  }
  return String(l) === r;
}

export function createHeart(effectsRes: any[], form: Form): Heart {
  // * 内部生命周期
  const lifeCycles: LifeCycle[] = effectsRes.reduce(
    (buf: LifeCycle[], item: LifeCycle) => {
      if ('notify' in item) {
        return buf.concat(item);
      }
      return buf;
    },
    [],
  );
  // * 额外的生命周期
  const outLifeCycles: LifeCycle[][] = [];

  return {
    //* payload, context 为可选配置，context 除特殊情况，其他都为 form
    // TODO 不同 type 不同 payload
    publish(type: any, field?: any, context?: any) {
      if (isStr(type)) {
        lifeCycles.forEach((lifecycle) => {
          lifecycle.notify(type, field, context || form);
        });
        outLifeCycles.forEach((lifecycles) => {
          lifecycles.forEach((lifecycle) => {
            lifecycle.notify(type, field, context || form);
          });
        });
      }
    },
  };
}

export function runEffects(form: Form, ...args: ((...arg: any) => void)[]) {
  EFFECT_STATE.lifecycles = [];
  EFFECT_STATE.effectStart = true;
  EFFECT_STATE.effectEnd = false;

  args.forEach((effects) => {
    if (isFn(effects)) {
      effects(form);
    }
  });

  EFFECT_STATE.effectStart = false;
  EFFECT_STATE.effectEnd = true;
  return EFFECT_STATE.lifecycles;
}

export const onFormInit = initFormLifeCycle(LC.ON_FORM_INIT);
export const onFormMount = initFormLifeCycle(LC.ON_FORM_MOUNT);
export const onFormUnmount = initFormLifeCycle(LC.ON_FORM_UNMOUNT);
export const onFieldInit = initFormLifeCycle(LC.ON_FIELD_INIT);

export const onFieldValueChange = initFieldLifeCycle(LC.ON_FIELD_VALUE_CHANGE);
