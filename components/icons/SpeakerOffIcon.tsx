
import React from 'react';

export const SpeakerOffIcon = ({ className }: { className?: string }): React.ReactNode => {
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
            <path d="M8 7H12L16 3V10.5L13.5 8L8 13V7Z" />
            <path d="M21.121 22.536L18 19.414L16 17.414V21L12 17H8V15H9.414L3.464 9.05L2.05 7.636L3.464 6.222L22.536 21.121L21.121 22.536Z" />
        </svg>
    );
};
