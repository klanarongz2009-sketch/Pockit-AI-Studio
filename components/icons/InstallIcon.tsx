import React from 'react';

export const InstallIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M7 2H17V3H18V21H16V22H8V21H6V3H7V2Z M8 4H16V20H8V4Z"/>
            <path d="M11 7H13V12H15L12 15L9 12H11V7Z"/>
        </svg>
    );
};
