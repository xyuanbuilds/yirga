type RC<P> = React.FunctionComponent<P> | React.ComponentClass<P>;

type HOC<O, P> = (C: RC<O>) => RC<P>;

const compose = <P>(C: RC<P>, ...hocs: HOC<any, any>[]) =>
  hocs.reduce((g, f) => f(g), C);

export default compose;
