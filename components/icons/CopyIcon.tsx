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
            <path d="M8 4H18V6H20V16H18V18H8V16H6V6H8V4Z"/>
            <path fill="var(--color-bg, black)" d="M10 8H16V14H10V8Z"/>
        </svg>
    );
};
