import type { CSSProperties, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const pill = cva('overflow-hidden rounded-[5px] border border-transparent px-1.5 py-0.5 text-[11px] text-ellipsis whitespace-nowrap', {
  variants: {
    tone: {
      holiday: 'bg-subtle text-fg',
      person:
        'bg-[hsl(var(--hue)_85%_90%)] text-[hsl(var(--hue)_65%_26%)] dark:bg-[hsl(var(--hue)_55%_35%/0.4)] dark:text-[hsl(var(--hue)_85%_80%)]',
    },
    pending: { true: 'border-dashed border-current', false: '' },
  },
  defaultVariants: { tone: 'holiday', pending: false },
});

export interface DayPillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pill> {
  hue?: number;
}

export function DayPill({ tone, pending, hue, className, style, ...props }: DayPillProps) {
  const colors = hue === undefined ? style : ({ ...style, '--hue': hue } as CSSProperties);
  return <span className={cn(pill({ tone: hue === undefined ? tone : 'person', pending }), className)} style={colors} {...props} />;
}
