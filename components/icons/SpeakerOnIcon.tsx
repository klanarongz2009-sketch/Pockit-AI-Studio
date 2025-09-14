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
            <path d="M4 9H8V15H4V9Z M8 7H12L16 3V21L12 17H8V7Z"/>
            <path d="M18 9H19V15H18V9Z M20 7H21V17H20V7Z M22 5H23V19H22V5Z"/>
        </svg>
    );
};
