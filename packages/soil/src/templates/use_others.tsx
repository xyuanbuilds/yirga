import * as React from 'react';
import { Button } from 'antd';
import type { BaseButtonProps } from 'antd/lib/button/button.d';

type ButtonProps = React.ComponentPropsWithRef<typeof Button>;

type ButtonRefPropsType = ButtonProps['ref'];
type ButtonRefType = React.ElementRef<typeof Button>;
type ButtonBaseProps = BaseButtonProps;
