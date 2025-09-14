import React from 'react';

export const CoinsIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path fill="#DAA520" d="M6 16H18V18H6V16Z M6 12H18V14H6V12Z M6 8H18V10H6V8Z"/>
            <path fill="#FFD700" d="M6 14H18V16H6V14Z M6 10H18V12H6V10Z M6 6H18V8H6V6Z"/>
        </svg>
    );
};
