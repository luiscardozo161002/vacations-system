import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, style, children }: FormFieldProps) {
  return (
    <div className="field" style={style}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
};

export function TextField({ label, hint, onChange, ...input }: TextFieldProps) {
  return (
    <FormField label={label} htmlFor={input.id} hint={hint}>
      <input {...input} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export interface SelectOption {
  value: string | number;
  label: string;
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
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
