import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const inputClass = 'admin-input';

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="admin-label">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-stone-500">{hint}</span>}
      {children}
    </label>
  );
}

type TextInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function TextInput({ label, hint, value, onChange, className, ...props }: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={`${inputClass} ${className ?? ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </Field>
  );
}

type PriceInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function PriceInput({ label, hint, value, onChange, required }: PriceInputProps) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">R$</span>
        <input
          required={required}
          inputMode="decimal"
          placeholder="0,00"
          className={`${inputClass} pl-10`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

type NumberInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function NumberInput({ label, hint, value, onChange, suffix, className, ...props }: NumberInputProps) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type="number"
          className={`${inputClass} ${suffix ? 'pr-10' : ''} ${className ?? ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{suffix}</span>
        )}
      </div>
    </Field>
  );
}

type SelectInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'children'>;

export function SelectInput({ label, hint, value, onChange, children, className, ...props }: SelectInputProps) {
  return (
    <Field label={label} hint={hint}>
      <select
        className={`${inputClass} ${className ?? ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

type TextAreaInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>;

export function TextAreaInput({ label, hint, value, onChange, className, ...props }: TextAreaInputProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={`${inputClass} ${className ?? ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </Field>
  );
}

type CheckboxInputProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckboxInput({ label, checked, onChange }: CheckboxInputProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-700">
      <input type="checkbox" className="rounded border-stone-300 text-fresh-600 focus:ring-fresh-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
