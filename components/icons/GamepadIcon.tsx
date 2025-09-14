import React from 'react';

export const GamepadIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M3 8H21V16H18V18H6V16H3V8Z"/>
            <path fill="var(--color-bg, black)" d="M5 10H19V14H5V10Z"/>
            <path d="M6 10H8V14H6V10Z M10 10H12V14H10V10Z M7 9H11V15H7V9Z"/>
            <path d="M17 9H19V11H17V9Z M15 11H17V13H15V11Z"/>
        </svg>
    );
};
