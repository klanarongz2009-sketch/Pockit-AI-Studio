import React from 'react';

export const ReverseIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M10 9V5L3 12L10 19V14.9H12V9H10Z M21 5L14 12L21 19V5Z" />
    </svg>
);
