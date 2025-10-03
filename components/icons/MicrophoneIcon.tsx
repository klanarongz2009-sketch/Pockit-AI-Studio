import React from 'react';

export const MicrophoneIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 5H13V15H11V5Z"/>
            <path d="M9 8H15V12H9V8Z"/>
            <path d="M8 12H16V14H8V12Z"/>
            <path d="M10 18H14V20H10V18Z M8 16H16V18H8V16Z"/>
        </svg>
    );
};
