import React from 'react';

export const SunIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 2H13V6H11V2Z M18 5L19 4L20 5L19 6L18 5Z M22 11H18V13H22V11Z M19 20L20 19L19 18L18 19L19 20Z M13 22H11V18H13V22Z M5 20L6 19L5 18L4 19L5 20Z M2 13H6V11H2V13Z M4 5L5 4L6 5L5 6L4 5Z M16 8H8V16H16V8Z"/>
            <path fill="var(--color-bg, black)" d="M14 10H10V14H14V10Z"/>
        </svg>
    );
};
