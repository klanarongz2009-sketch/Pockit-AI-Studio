import React from 'react';

export const GiftIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 10H20V20H4V10Z"/>
            <path fill="var(--color-bg, black)" d="M6 12H18V18H6V12Z"/>
            <path d="M10 8H14V10H10V8Z M9 6H15V8H9V6Z"/>
            <path d="M11 10H13V20H11V10Z"/>
        </svg>
    );
};