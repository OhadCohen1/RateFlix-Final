import type { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = ({ label, error, id, ...inputProps }: InputFieldProps) => {
  const inputId = id ?? `field-${label}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-lg border bg-surface-800 px-3 py-2.5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-brand-500 ${
          error ? 'border-brand-500' : 'border-surface-700'
        }`}
        {...inputProps}
      />
      {error && <p className="text-sm text-brand-400">{error}</p>}
    </div>
  );
};

export default InputField;
