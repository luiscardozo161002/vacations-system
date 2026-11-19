import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-wrap items-center gap-2.5', className)} {...props} />;
}

export function ToolbarSpacer() {
  return <div className="flex-1" />;
}

export function RowActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex justify-end gap-1.5', className)} {...props} />;
}
