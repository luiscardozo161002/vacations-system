import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const avatar = cva('flex shrink-0 items-center justify-center rounded-full bg-neutral font-semibold text-fg', {
  variants: {
    size: {
      default: 'size-8 text-xs',
      lg: 'size-12 text-[15px]',
    },
  },
  defaultVariants: { size: 'default' },
});

export interface AvatarProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatar> {}

export function Avatar({ size, className, ...props }: AvatarProps) {
  return <div className={cn(avatar({ size }), className)} {...props} />;
}
