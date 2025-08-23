import React from 'react';

export const ShareIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Arrow */}
            <path d="M21 3H19V7H17V9H21V3Z" />
            <path d="M15 9H17V11H15V9Z" />
            
            {/* Box */}
            <path d="M4 5H14V7H6V19H18V12H20V21H4V5Z" />
        </svg>
    );
};
