import React from 'react';

export const MagicButtonIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 4H20V20H4V4Z"/>
            <path fill="var(--color-bg, black)" d="M6 6H18V18H6V6Z"/>
            <path d="M8 8H16V16H8V8Z"/>
        </svg>
    );
};
