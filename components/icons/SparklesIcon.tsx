import React from 'react';

export const SparklesIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 3H13V7H11V3Z M17 11H21V13H17V11Z M11 17H13V21H11V17Z M3 11H7V13H3V11Z M8 8H16V16H8V8Z"/>
            <path fill="var(--color-bg, black)" d="M10 10H14V14H10V10Z"/>
            <path d="M5 4H7V6H5V4Z M17 4H19V6H17V4Z M17 18H19V20H17V18Z M5 18H7V20H5V18Z"/>
        </svg>
    );
};
