function foo() {
  return {
    a: 1,
    subArr: [
      {
        c: 3,
        d: 'string',
      },
    ],
  };
}

type Return = ReturnType<typeof foo>;
type SubArr = Return['subArr'];
type SubArrItem = SubArr[0];

const baz: SubArrItem = {
  c: 5,
  d: '6', // type checks number -> string
};

type A = 'a' | 'b' | 'c' | 'd';
type B = 'a' | 'c' | 'f';
type Intersection = Extract<A, B>; // A & B
type Union = A | B;
type Difference = Exclude<A, B>;

// 理解 infer：类型分发中的占位符
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
type Intersection2 = UnionToIntersection<{ a: 1 } | { b: 2 }>;
type Intersection3 = UnionToIntersection<'1' | '2'>;

type ParamsIntersection<T> = T extends {
  [key: string]: (x: infer U) => void;
}
  ? U
  : never;

type Params = ParamsIntersection<{
  a: (a: string) => void;
  b: (b: { b: number }) => void;
}>;

// 函数重载入

interface IdLabel {
  id: number /* some fields */;
}
interface NameLabel {
  name: string /* other fields */;
}
type NameOrId<T extends number | string> = T extends number
  ? IdLabel
  : NameLabel;
function createLabel<T extends number | string>(idOrName: T): NameOrId<T> {
  throw new Error('unimplemented');
}

const a = createLabel(1);
