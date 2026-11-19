import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const grid = cva('grid gap-4', {
  variants: {
    cols: {
      2: 'grid-cols-2 max-sm:grid-cols-1',
      3: 'grid-cols-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1',
      4: 'grid-cols-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1',
    },
  },
  defaultVariants: { cols: 2 },
});

export interface GridProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof grid> {}

export function Grid({ cols, className, ...props }: GridProps) {
  return <div className={cn(grid({ cols }), className)} {...props} />;
}
