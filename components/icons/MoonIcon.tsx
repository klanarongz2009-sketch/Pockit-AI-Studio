
import React from 'react';

export const MoonIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M10 4H14V5H15V6H16V8H15V7H14V6H10V7H9V8H8V10H9V12H10V14H11V15H12V16H14V17H15V18H14V19H10V18H9V17H8V15H9V14H10V12H11V10H12V8H11V6H10V4Z" />
            <path d="M15 9H17V11H15V9Z" />
        </svg>
    );
};
