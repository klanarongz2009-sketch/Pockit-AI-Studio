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
            <path d="M4 9H8V15H4V9Z M8 7H12L16 3V21L12 17H8V7Z"/>
            <path d="M22 6L18 10V14L22 18V19L23 18L19 14V10L23 6V5L22 6Z M18 6L22 10V14L18 18V19L17 18L21 14V10L17 6V5L18 6Z"/>
        </svg>
    );
};
