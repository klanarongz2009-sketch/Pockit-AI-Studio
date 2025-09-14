import React from 'react';

export const SoundWaveIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 10H6V14H4V10Z M7 8H9V16H7V8Z M10 5H12V19H10V5Z M13 8H15V16H13V8Z M16 10H18V14H16V10Z M19 12H21V12H19V12Z" />
        </svg>
    );
};
