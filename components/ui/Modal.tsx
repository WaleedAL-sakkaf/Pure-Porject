
import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import Button from './Button'; // Import Button for consistent styling

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'; // Added more sizes
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer, hideCloseButton = false }) => {
  const titleId = useId();
  
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto'; // Restore scroll
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full h-full sm:max-h-screen sm:h-auto rounded-none sm:rounded-lg', // Adjust full for better screen fit
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out animate-fadeInOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={onClose} // Close on overlay click
    >
      <div 
        className={`bg-card text-foreground rounded-lg shadow-xl dark:shadow-xl-dark w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] sm:max-h-[95vh] transform transition-all duration-300 ease-out animate-scaleUpModal`}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            {title ? (
              <h3 id={titleId} className="text-xl font-semibold text-foreground">{title}</h3>
            ) : <div /> /* Empty div to keep X button to the right if no title */}
            {!hideCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:bg-secondary-hover hover:text-secondary-text -m-2" // Negative margin for better visual alignment
                aria-label="إغلاق"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeInOverlay {
          animation: fadeInOverlay 0.3s ease-out forwards;
        }
        @keyframes scaleUpModal {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleUpModal {
          animation: scaleUpModal 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
