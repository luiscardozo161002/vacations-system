import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const control =
  'w-full rounded-sm border border-line bg-surface text-base text-fg focus:border-fg focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none aria-invalid:border-danger-fg disabled:cursor-default disabled:bg-subtle disabled:text-muted';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-[38px] px-3', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'resize-y px-3 py-2.5', className)} {...props} />;
}
