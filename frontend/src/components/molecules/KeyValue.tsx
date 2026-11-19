import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface KeyValueProps {
  label: ReactNode;
  valueClassName?: string;
  children: ReactNode;
}

export function KeyValue({ label, valueClassName, children }: KeyValueProps) {
  return (
    <div>
      <div className="mb-0.5 text-xs text-muted">{label}</div>
      <div className={cn('text-[13.5px] font-medium', valueClassName)}>{children}</div>
    </div>
  );
}

export function KeyValueGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('grid grid-cols-2 gap-x-4 gap-y-3.5 max-sm:grid-cols-1', className)}>{children}</div>;
}
