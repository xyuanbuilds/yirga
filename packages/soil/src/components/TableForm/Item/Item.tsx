import * as React from 'react';
import cls from 'classnames';
import './styles.less';

type FormItemProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  fullness?: boolean;
  feedbacks?: React.ReactNode[];
}>;

const prefixCls = 'ant-array-form-item';

function Item({ children, fullness = true, feedbacks }: FormItemProps) {
  const feedbackStatus =
    Array.isArray(feedbacks) && feedbacks.length > 0 ? 'error' : 'success';
  const feedbackText = Array.isArray(feedbacks) && feedbacks.join(',');

  const wrapperCls = cls({
    [`${prefixCls}`]: true,
    [`${prefixCls}-${feedbackStatus}`]: !!feedbackStatus,
    [`${prefixCls}-feedback-has-text`]: !!feedbackText,
    [`${prefixCls}-fullness`]: !!fullness,
  });
  return (
    <div className={wrapperCls}>
      {children}
      {!!feedbackText && (
        <div
          className={cls({
            [`${prefixCls}-${feedbackStatus}-help`]: !!feedbackStatus,
            [`${prefixCls}-help`]: true,
            [`${prefixCls}-help-enter`]: true,
            [`${prefixCls}-help-enter-active`]: true,
          })}
          style={{ position: 'absolute', left: 0, zIndex: 1 }}
        >
          {feedbackText}
        </div>
      )}
    </div>
  );
}

export default Item;
