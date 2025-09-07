
import React from 'react';

export const SunIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 2H13V6H11V2Z" />
            <path d="M18 5H20V7H18V5Z" />
            <path d="M22 11H18V13H22V11Z" />
            <path d="M20 17H18V19H20V17Z" />
            <path d="M13 22H11V18H13V22Z" />
            <path d="M6 19H4V17H6V19Z" />
            <path d="M2 13H6V11H2V13Z" />
            <path d="M4 7H6V5H4V7Z" />
            <path d="M8 8H16V16H8V8Z" />
        </svg>
    );
};
