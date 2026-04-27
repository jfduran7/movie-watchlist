import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input
          ref={ref}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        {helperText && !error && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
