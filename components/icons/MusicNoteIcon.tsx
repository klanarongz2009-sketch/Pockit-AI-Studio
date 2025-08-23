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
            <path d="M10 4H12V15H10V4Z" />
            <path d="M12 15H14V17H12V15Z" />
            <path d="M14 17H16V19H14V17Z" />
            <path d="M10 19H14V21H10V19Z" />
            <path d="M10 8H16V10H10V8Z" />
            <path d="M10 4H16V6H10V4Z" />
        </svg>
    );
};
