import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const pill = cva('overflow-hidden rounded-[5px] px-1.5 py-0.5 text-[11px] text-ellipsis whitespace-nowrap', {
  variants: {
    status: {
      holiday: 'bg-subtle text-fg',
      approved: 'bg-success text-success-fg',
      pending: 'bg-warning text-warning-fg',
    },
  },
  defaultVariants: { status: 'holiday' },
});

export interface DayPillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pill> {}

export function DayPill({ status, className, ...props }: DayPillProps) {
  return <span className={cn(pill({ status }), className)} {...props} />;
}
