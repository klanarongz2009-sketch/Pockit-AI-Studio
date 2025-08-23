
import React from 'react';

export const SpeakerOnIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 9H8V15H4V9Z" />
            <path d="M8 7H12L16 3V21L12 17H8V7Z" />
            <path d="M18 9H20V15H18V9Z" />
            <path d="M21 6H23V18H21V6Z" />
        </svg>
    );
};
