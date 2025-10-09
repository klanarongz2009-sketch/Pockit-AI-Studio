import React from 'react';

export const EmulatorIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M3 4H21V20H3V4Z"/>
        <path fill="var(--color-bg, black)" d="M5 6H19V18H5V6Z"/>
        <path d="M7 8H8V9H9V10H10V9H9V8H8V7H7V8Z M11 8H17V9H11V8Z M7 11H17V12H7V11Z"/>
    </svg>
);
