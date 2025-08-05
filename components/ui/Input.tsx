
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'input' | 'textarea'; // To allow textarea
  rows?: number; // For textarea
}

const Input: React.FC<InputProps> = ({ label, name, error, className = '', wrapperClassName = '', leftIcon, rightIcon, as = 'input', rows, ...props }) => {
  const commonInputStyles = `w-full py-2.5 border bg-transparent text-foreground placeholder-muted-foreground
    rounded-lg shadow-sm focus:outline-none focus:ring-2 
    focus:border-transparent transition-colors duration-150 ease-in-out
    ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-border focus:ring-primary/50 focus:border-primary'}
    ${leftIcon ? 'ps-10' : 'px-3'} ${rightIcon ? 'pe-10' : 'px-3'}`;
  
  const Element = as;

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <Element
          id={name}
          name={name}
          rows={as === 'textarea' ? rows : undefined}
          className={`${commonInputStyles} ${className}`}
          {...(props as any)} // Cast to any to avoid type issues with different element props
        />
        {rightIcon && (
          <div className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground" aria-hidden="true">
             {/* If it's a button or interactive, make it so. For now, assuming decorative. */}
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;