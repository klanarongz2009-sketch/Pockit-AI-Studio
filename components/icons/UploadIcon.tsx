import React from 'react';

export const UploadIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 18H13V8H11V18Z M8 10L12 6L16 10H13V12H11V10H8Z M4 20H20V22H4V20Z"/>
        </svg>
    );
};
