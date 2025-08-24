import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onBack }) => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center font-press-start"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-black w-full h-full flex flex-col border-4 border-brand-light outline-none`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <header className="flex items-center justify-between p-3 border-b-4 border-brand-light bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm underline hover:text-brand-yellow transition-colors font-sans"
                aria-label="กลับ"
              >
                &#x2190; กลับ
              </button>
            )}
            <h2 id="modal-title" className="text-base sm:text-lg text-brand-yellow">
              {title}
            </h2>
          </div>
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