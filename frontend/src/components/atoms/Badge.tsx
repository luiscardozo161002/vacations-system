import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badge = cva(
  "inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-medium before:size-1.5 before:rounded-full before:bg-current before:content-['']",
  {
    variants: {
      tone: {
        success: 'bg-success text-success-fg',
        warning: 'bg-warning text-warning-fg',
        danger: 'bg-danger text-danger-fg',
        neutral: 'bg-neutral text-neutral-fg',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
