import React from 'react';

export const TrashIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M6 7H18V8H19V10H18V21H6V10H5V8H6V7Z M8 10H16V19H8V10Z"/>
            <path d="M9 2H15V5H9V2Z"/>
            <path fill="var(--color-bg, black)" d="M10 12H11V17H10V12Z M13 12H14V17H13V12Z"/>
        </svg>
    );
};
