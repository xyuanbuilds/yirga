declare module '*.less' {
  const styles: {
    readonly [key: string]: string;
  };

  export type ClassName = string;

  export default styles;
}
