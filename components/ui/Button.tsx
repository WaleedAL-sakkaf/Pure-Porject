
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary text-primary-text hover:bg-primary-hover shadow-sm hover:shadow-md focus-visible:ring-primary',
    secondary: 'bg-secondary text-secondary-text hover:bg-secondary-hover focus-visible:ring-secondary-dark border border-border dark:border-slate-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-primary hover:bg-primary-hover/10 focus-visible:ring-primary dark:text-primary-light dark:hover:bg-primary-hover/20',
    link: 'bg-transparent text-primary hover:underline focus-visible:ring-primary dark:text-primary-light p-0 h-auto',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2', // For icon-only buttons
  };

  const isDisabled = isLoading || props.disabled;
  
  const loadingIconColor = 
    variant === 'primary' || variant === 'danger' || variant === 'success' ? 'text-primary-text' : 
    variant === 'secondary' ? 'text-secondary-text' : 
    'text-primary dark:text-primary-light';


  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin h-5 w-5 ${leftIcon ? '-ms-1 me-2' : rightIcon ? 'me-0' : 'me-0'} ${loadingIconColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className={`${children ? "me-2" : ""}`} aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className={`${children ? "ms-2" : ""}`} aria-hidden="true">{rightIcon}</span>}
    </button>
  );
};

export default Button;