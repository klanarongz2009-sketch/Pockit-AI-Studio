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
        {/* Speech Bubble */}
        <path d="M4 4H20V16H14L12 18L10 16H4V4Z" />
        {/* A character */}
        <path fill="#000000" d="M11 7H13V8H14V12H13V13H11V12H10V8H11V7ZM11 9H13V11H11V9Z" />
    </svg>
);
