
import React from 'react';
import { SelectOption } from '../../types'; 
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  wrapperClassName?: string;
  placeholder?: string; 
  leftIcon?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  name, 
  options, 
  error, 
  className = '', 
  wrapperClassName = '', 
  placeholder,
  leftIcon,
  ...restProps 
}) => {
  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none z-10 text-muted-foreground" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <select
          id={name}
          name={name}
          className={`w-full py-2.5 border bg-transparent text-foreground
            rounded-lg shadow-sm focus:outline-none focus:ring-2 
            focus:border-transparent transition-colors duration-150 ease-in-out appearance-none
            ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-border focus:ring-primary/50 focus:border-primary'}
            ${leftIcon ? 'ps-10' : 'px-3'} pe-10 ${className}`} // Added pe-10 for arrow
          {...restProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-card text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 end-0 flex items-center px-3 pointer-events-none text-muted-foreground">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;