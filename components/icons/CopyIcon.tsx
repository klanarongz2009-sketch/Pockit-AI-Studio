import React from 'react';

export const CopyIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M6 4H16V6H18V18H16V20H6V18H4V6H6V4Z" />
            <path fill="black" d="M8 8H14V16H8V8Z" />
        </svg>
    );
};