import React from 'react';

export const UrlDownloaderIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Download Arrow */}
            <path d="M8 9H11V2H13V9H16L12 13L8 9Z" />

            {/* Cloud */}
            <path d="M17 12H19V14H17V12Z" />
            <path d="M15 14H19V16H15V14Z" />
            <path d="M5 14H7V16H5V14Z" />
            <path d="M5 12H7V14H5V12Z" />
            <path d="M7 16H17V18H7V16Z" />
            <path d="M9 18H15V20H9V18Z" />
            <path d="M7 14H9V12H7V14Z" />
            <path d="M15 14H17V12H15V14Z" />
        </svg>
    );
};
