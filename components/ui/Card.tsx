
import React from 'react';

interface CardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  onClick?: () => void;
  actions?: React.ReactNode; // For placing buttons or actions in the header
}

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  titleClassName = '', 
  bodyClassName = '', 
  footer,
  footerClassName = '',
  onClick,
  actions 
}) => {
  return (
    <div 
      className={`bg-card text-foreground border border-border shadow-md dark:shadow-md-dark rounded-xl overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg dark:hover:shadow-lg-dark hover:border-primary/50' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      {(title || actions) && (
        <div className={`p-4 sm:p-5 border-b border-border flex justify-between items-center ${titleClassName}`}>
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          ) : title}
          {actions && <div className="flex items-center space-s-2">{actions}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`p-4 sm:p-5 border-t border-border bg-slate-50 dark:bg-slate-800/50 ${footerClassName}`}>
            {footer}
        </div>
      )}
    </div>
  );
};

export default Card;