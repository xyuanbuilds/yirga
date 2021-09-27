import React from 'react';
import { observer } from '@formily/reactive-react';
import type { GeneralField } from './types/Field';

type C<
  P = {
    value?: any;
    onChange: (e: Event) => void;
  }
> = React.FunctionComponent<P> | React.ComponentClass<P> | string;
interface ReactiveFieldProps {
  field: GeneralField;
  children?:
    | ((
        field: GeneralField,
        form: Formily.Core.Models.Form,
      ) => React.ReactChild)
    | React.ReactNode;
  component?: C[];
}

const ReactiveInternal: React.FC<ReactiveFieldProps> = (props) => {
  const { field, children, component } = props;

  if (!component) return null;
  if (!field || !component) {
    return <>{children}</>;
  }

  // if (field.display !== 'visible') return null;

  const renderComponent = () => {
    // const value = !isVoidField(field) ? field.value : undefined;

    const onChange = (event) => {
      field.onInput(event);
    };

    // const disabled = !isVoidField(field)
    //   ? field.pattern === 'disabled' || field.pattern === 'readPretty'
    //   : undefined;
    // const readOnly = !isVoidField(field)
    //   ? field.pattern === 'readOnly'
    //   : undefined;

    return React.createElement(
      component[0],
      {
        value: field.value,
        onChange,
      },
      children,
    );
  };

  return renderComponent();
};

ReactiveInternal.displayName = 'ReactiveInternal';

const ReactiveField = observer(ReactiveInternal, {
  displayName: 'ReactiveField',
});

export default ReactiveField;
