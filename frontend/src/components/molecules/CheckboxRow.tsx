import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Checkbox } from '../atoms/Checkbox';

interface CheckboxRowProps extends Omit<ComponentProps<typeof Checkbox>, 'className' | 'children'> {
  className?: string;
  children: ReactNode;
}

export function CheckboxRow({ className, children, ...checkbox }: CheckboxRowProps) {
  return (
    <label className={cn('mb-1.5 flex cursor-pointer items-center gap-2 text-sm', className)}>
      <Checkbox {...checkbox} />
      {children}
    </label>
  );
}
