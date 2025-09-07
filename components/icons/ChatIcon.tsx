import React from 'react';

export const ChatIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 4H20V16H14L12 18L10 16H4V4Z" />
        </svg>
    );
};