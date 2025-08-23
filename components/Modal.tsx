import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;
    
    // ESC key handler
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Focus trap logic
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        // if there are no focusable elements, prevent tabbing out
        if (!firstElement) {
            event.preventDefault();
            return;
        }

        if (event.shiftKey) { // shift + tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else { // tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    };
    modal.addEventListener('keydown', handleTabKey);

    // Defer focus setting to allow elements to become visible and prevent race conditions
    const timerId = setTimeout(() => {
        try {
            if (firstElement) {
                firstElement.focus();
            } else {
                modal.focus({ preventScroll: true });
            }
        } catch (e) {
            console.error("Failed to focus on modal element", e);
             try {
                modal.focus({ preventScroll: true }); // fallback
            } catch (e2) {
                console.error("Failed to focus on modal container", e2);
            }
        }
    }, 50);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (modal) {
        modal.removeEventListener('keydown', handleTabKey);
      }
      clearTimeout(timerId);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
      default: 'sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh]',
      large: 'sm:max-w-4xl lg:max-w-6xl max-h-[95vh]',
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 font-press-start"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-black w-full flex flex-col border-4 border-brand-light shadow-pixel outline-none ${sizeClasses}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <header className="flex items-center justify-between p-3 border-b-4 border-brand-light bg-black/20 flex-shrink-0">
          <h2 id="modal-title" className="text-base sm:text-lg text-brand-yellow">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-brand-magenta text-white border-2 border-brand-light hover:bg-brand-yellow hover:text-black transition-colors text-sm"
          >
            X
          </button>
        </header>
        <main className="p-4 sm:p-6 text-brand-light overflow-y-auto font-sans">
            {children}
        </main>
      </div>
    </div>
  );
};