import React from 'react';

export const MenuIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 6H20V8H4V6Z M4 11H20V13H4V11Z M4 16H20V18H4V16Z" />
        </svg>
    );
};
