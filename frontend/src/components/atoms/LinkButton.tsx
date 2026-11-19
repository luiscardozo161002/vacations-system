import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function LinkButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn('cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-fg underline underline-offset-2', className)}
      {...props}
    />
  );
}
