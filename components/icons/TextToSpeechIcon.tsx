import React from 'react';

export const TextToSpeechIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M4 4H20V16H14L12 18L10 16H4V4Z" />
        <path d="M19 19H21V21H19V19Z M16 19H18V21H16V19Z M13 19H15V21H13V19Z"/>
    </svg>
);
