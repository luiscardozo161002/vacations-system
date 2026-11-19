import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const button = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent font-medium tracking-[-0.01em] transition-[background-color,border-color,transform] duration-[120ms] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:size-4',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover dark:border-line',
        secondary: 'border-secondary-line bg-secondary text-secondary-fg hover:bg-secondary-hover',
        outline: 'border-line bg-surface text-fg hover:bg-subtle',
        ghost: 'bg-transparent text-muted hover:bg-subtle hover:text-fg',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-[30px] px-2.5 text-sm',
      },
    },
    compoundVariants: [{ variant: 'ghost', size: 'default', className: 'h-8 px-2' }],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />;
}
