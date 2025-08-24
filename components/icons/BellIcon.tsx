import React from 'react';

export const BellIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M9 4H15V6H9V4Z" />
            <path d="M7 6H17V8H7V6Z" />
            <path d="M6 8H18V16H6V8Z" />
            <path d="M7 16H17V18H7V16Z" />
            <path d="M9 18H15V20H9V18Z" />
        </svg>
    );
};
