import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function TabList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" className={cn('mb-[18px] flex gap-1 border-b border-line', className)} {...props} />;
}

interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export function Tab({ active, className, ...props }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        '-mb-px cursor-pointer border-b-2 border-transparent px-3.5 py-2.5 text-[13.5px] font-medium text-muted',
        active && 'border-fg text-fg',
        className,
      )}
      {...props}
    />
  );
}
