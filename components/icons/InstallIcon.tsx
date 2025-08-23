import React from 'react';

export const InstallIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Phone outline */}
            <path d="M17 2H7V3H6V21H18V3H17V2ZM16 20H8V4H16V20Z" />
            {/* Download Arrow */}
            <path d="M12 14L9 11H11V7H13V11H15L12 14Z" />
            <path d="M9 16H15V17H9V16Z" />
        </svg>
    );
};
