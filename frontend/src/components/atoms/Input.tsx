import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const control =
  'w-full rounded-sm border border-line bg-surface text-base text-fg focus:border-fg focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] focus:outline-none';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-[38px] px-3', className)} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  compact?: boolean;
}

export function Select({ compact = false, className, ...props }: SelectProps) {
  return <select className={cn(control, compact ? 'h-9 w-auto px-2.5' : 'h-[38px] px-3', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'resize-y px-3 py-2.5', className)} {...props} />;
}

export function Checkbox({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="checkbox" className={cn('size-4 shrink-0 cursor-pointer', className)} {...props} />;
}
