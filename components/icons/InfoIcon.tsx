import React from 'react';

export const InfoIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 4H20V20H4V4Z" />
            <path fill="black" d="M6 6H18V18H6V6Z" />
            <path d="M11 8H13V10H11V8Z" />
            <path d="M11 12H13V16H11V12Z" />
        </svg>
    );
};
