import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Checkbox } from '../atoms/Input';

interface CheckboxRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  className?: string;
  children: ReactNode;
}

export function CheckboxRow({ className, children, ...input }: CheckboxRowProps) {
  return (
    <label className={cn('mb-1.5 flex items-center gap-2 text-sm', className)}>
      <Checkbox {...input} />
      {children}
    </label>
  );
}
