import React from 'react';

export const MusicNoteIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M10 4H12V16H14V18H10V16H14V12H10V4Z M10 8H16V10H10V8Z"/>
        </svg>
    );
};
