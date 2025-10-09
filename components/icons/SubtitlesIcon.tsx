import React from 'react';

export const SubtitlesIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M4 6H20V18H4V6Z" />
        <path fill="black" d="M6 8H18V16H6V8Z" />
        <path d="M7 10H17V11H7V10Z" />
        <path d="M7 13H15V14H7V13Z" />
    </svg>
);