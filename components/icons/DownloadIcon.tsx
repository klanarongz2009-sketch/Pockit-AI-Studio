
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
            <path d="M8 11H11V2H13V11H16L12 15L8 11Z" />
            <path d="M4 17H20V19H4V17Z" />
        </svg>
    );
};
