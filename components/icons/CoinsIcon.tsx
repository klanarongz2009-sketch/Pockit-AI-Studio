
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
            <path fill="#FFD700" d="M8 6H16V8H8V6Z" />
            <path fill="#FFD700" d="M6 8H18V18H6V8Z" />
            <path fill="#FFD700" d="M8 18H16V20H8V18Z" />
            <path fill="#DAA520" d="M10 10H14V16H10V10Z" />
             <path fill="#DAA520" d="M11 11H13V12H11V11Z" />
             <path fill="#DAA520" d="M11 14H13V15H11V14Z" />
        </svg>
    );
};
