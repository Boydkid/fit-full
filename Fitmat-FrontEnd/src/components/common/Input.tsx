import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  error?: string;
  className?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  showPassword?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  minLength?: number;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  autoFocus = false,
  autoComplete,
  error,
  className = '',
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false,
  min,
  max,
  disabled = false,
  minLength,
}: InputProps) {
  const baseClasses = 'w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500' : '';
  const passwordClasses = showPasswordToggle ? 'pr-12' : '';
  
  const classes = `${baseClasses} ${errorClasses} ${passwordClasses} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-slate-700 font-semibold">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          min={min}
          max={max}
          disabled={disabled}
          minLength={minLength}
          className={classes}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
