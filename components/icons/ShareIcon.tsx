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
            <path d="M14 4H12V10H14V8H18V4H14Z M16 6H14V4H12L16 0L20 4H18V6H16Z"/>
            <path d="M4 8H14V10H6V20H18V12H20V22H4V8Z"/>
        </svg>
    );
};
