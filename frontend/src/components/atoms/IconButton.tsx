import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function IconButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex size-9 cursor-pointer items-center justify-center rounded-sm border border-line bg-surface text-muted transition-[background-color,color,transform] duration-[120ms] hover:bg-subtle hover:text-fg active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
}
