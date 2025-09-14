import React from 'react';

export const DownloadIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 4H13V14H11V4Z M8 12L12 16L16 12H13V10H11V12H8Z M4 18H20V20H4V18Z"/>
        </svg>
    );
};
