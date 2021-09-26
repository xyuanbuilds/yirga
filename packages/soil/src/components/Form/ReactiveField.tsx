import React from 'react';
import { observer } from '@formily/reactive-react';
import { isVoidField } from '@formily/core';

interface ReactiveFieldProps {
  field: Formily.Core.Types.GeneralField;
  children?:
    | ((
        field: Formily.Core.Types.GeneralField,
        form: Formily.Core.Models.Form,
      ) => React.ReactChild)
    | React.ReactNode;
}

const ReactiveInternal: React.FC<ReactiveFieldProps> = (props) => {
  const { field, children } = props;
  if (!props.field) {
    return <>{props.children}</>;
  }

  if (field.display !== 'visible') return null;

  const renderDecorator = (fieldChildren: React.ReactNode) => {
    if (!field.decorator[0]) {
      return <>{fieldChildren}</>;
    }
    return React.createElement(
      field.decorator[0],
      {
        ...field.decorator[1],
        style: {
          ...field.decorator[1]?.style,
        },
      },
      fieldChildren,
    );
  };

  const renderComponent = () => {
    if (!field.component[0]) return <>{children}</>;
    const value = !isVoidField(field) ? field.value : undefined;
    const onChange = !isVoidField(field)
      ? (...args: any[]) => {
          field.onInput(...args);
          field.component[1]?.onChange?.(...args);
        }
      : field.component[1]?.onChange;

    const disabled = !isVoidField(field)
      ? field.pattern === 'disabled' || field.pattern === 'readPretty'
      : undefined;
    const readOnly = !isVoidField(field)
      ? field.pattern === 'readOnly'
      : undefined;
    return React.createElement(
      field.component[0],
      {
        disabled,
        readOnly,
        ...field.component[1],
        style: {
          ...field.component[1]?.style,
        },
        value,
        onChange,
      },
      children,
    );
  };

  return renderDecorator(renderComponent());
};

ReactiveInternal.displayName = 'ReactiveInternal';

const ReactiveField = observer(ReactiveInternal, {
  forwardRef: true,
  displayName: 'ReactiveField',
});

export default ReactiveField;
