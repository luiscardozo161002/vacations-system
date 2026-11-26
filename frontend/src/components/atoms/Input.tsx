import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { control } from './control';
import { Icon } from './Icon';

function PasswordInput({ className, disabled, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={cn(control, 'h-[38px] pr-11 pl-3', className)}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-1.5 my-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} />
      </button>
    </div>
  );
}

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  if (type === 'password') return <PasswordInput className={className} {...props} />;
  return <input type={type} className={cn(control, 'h-[38px] px-3', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'resize-y px-3 py-2.5', className)} {...props} />;
}
