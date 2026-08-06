import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id || `password-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
            {label}
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
            <Lock className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            id={fieldId}
            type={showPassword ? 'text' : 'password'}
            className={`w-full pl-10 pr-11 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
              error
                ? 'border-red-500/80 focus:border-red-500'
                : 'border-[#48473f] focus:border-[#e6e2df]'
            } ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8c887e] hover:text-[#e6e2df] focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p id={`${fieldId}-error`} className="text-xs font-mono text-red-400 pt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
