
import React from 'react';

export const SettingsIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M9 4H15V6H17V8H19V16H17V18H15V20H9V18H7V16H5V8H7V6H9V4Z" />
            <path fill="black" d="M11 8H13V16H11V8Z" />
            <path fill="black" d="M8 11H16V13H8V11Z" />
        </svg>
    );
};
