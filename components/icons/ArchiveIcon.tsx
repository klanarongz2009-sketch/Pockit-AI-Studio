import React from 'react';

export const ArchiveIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M4 3H20V9H4V3Z" />
        <path d="M3 8H21V21H3V8Z" />
        <path fill="var(--color-bg, black)" d="M5 5H19V8H5V5Z M5 10H19V19H5V10Z" />
        <path d="M10 13H14V15H10V13Z" />
    </svg>
);
