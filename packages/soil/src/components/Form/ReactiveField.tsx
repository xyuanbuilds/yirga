import React from 'react';
import { observer } from '@formily/reactive-react';
import type { GeneralField, FieldProps } from './types/Field';
import type { Form } from './types/Form';

interface OnlyObservableProps {
  field?: GeneralField;
  onlyObservable: true;
  children?:
    | ((field: GeneralField, form: Form) => React.ReactChild)
    | React.ReactNode;
}

interface BasicProps {
  field: GeneralField;
  decorator?: FieldProps['decorator'];
  component: FieldProps['component'];
  children?:
    | ((field: GeneralField, form: Form) => React.ReactChild)
    | React.ReactNode;
}

type ReactiveFieldProps = OnlyObservableProps | BasicProps;

const ReactiveInternal: React.FC<ReactiveFieldProps> = (props) => {
  const { field, children } = props;
  // * 仅提供 observable 功能
  if (('onlyObservable' in props && props.onlyObservable) || !field) {
    return <>{children}</>;
  }
  const { component, decorator } = props as BasicProps;

  if (!Array.isArray(component) || !component[0]) return null;

  // if (field.display !== 'visible') return null;
  const renderFeedbacks = (fieldComponent: React.ReactElement) => {
    const hasDecorator = Array.isArray(decorator);

    const decoratorElement = hasDecorator ? decorator![0] : React.Fragment;
    return React.createElement(
      decoratorElement,
      {
        feedbacks: field.feedbacks,
        ...(hasDecorator && decorator![1]),
      },
      fieldComponent,
    );
  };

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

    return renderFeedbacks(
      React.createElement(
        component[0],
        {
          // @ts-ignore
          ...(component[0].__ANT_CHECKBOX // eslint-disable-line no-underscore-dangle
            ? { checked: field.value }
            : { value: field.value }),
          onChange,
          ...component[1],
        },
        children,
      ),
    );
  };

  return renderComponent();
};

ReactiveInternal.displayName = 'ReactiveInternal';

const ReactiveField = observer(ReactiveInternal, {
  displayName: 'ReactiveField',
});

export default ReactiveField;
