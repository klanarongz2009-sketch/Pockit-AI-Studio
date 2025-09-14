import React from 'react';

export const XIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M7 6L6 7L11 12L6 17L7 18L12 13L17 18L18 17L13 12L18 7L17 6L12 11L7 6Z" />
        </svg>
    );
};