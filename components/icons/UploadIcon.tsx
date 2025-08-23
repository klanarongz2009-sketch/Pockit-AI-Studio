
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
            <path d="M8 9L12 5L16 9H13V16H11V9H8Z" />
            <path d="M4 18H20V20H4V18Z" />
        </svg>
    );
};
