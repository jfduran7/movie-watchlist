import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-600 hover:bg-gray-100',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
