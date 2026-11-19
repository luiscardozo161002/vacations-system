import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { describedBy } from '../../utils/described-by';
import { FieldError, FieldHint } from '../atoms/FieldText';
import { Input } from '../atoms/Input';
import { Select, type SelectOption } from '../atoms/Select';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('mb-4', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error && <FieldError id={htmlFor && `${htmlFor}-error`}>{error}</FieldError>}
      {hint && <FieldHint id={htmlFor && `${htmlFor}-hint`}>{hint}</FieldHint>}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string;
};

export function TextField({ label, hint, error, onChange, ...input }: TextFieldProps) {
  return (
    <FormField label={label} htmlFor={input.id} hint={hint} error={error}>
      <Input
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(input.id, hint, error)}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
}

export function SelectField({ id, label, value, options, onChange, required }: SelectFieldProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={onChange} options={options} required={required} />
    </FormField>
  );
}
