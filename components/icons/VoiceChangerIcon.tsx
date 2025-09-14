import React from 'react';

export const VoiceChangerIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M11 6H13V8H11V6Z M10 8H14V10H10V8Z M9 10H15V14H9V10Z M10 14H14V16H10V14Z"/>
            <path d="M4 10H6V14H4V10Z M7 8H9V16H7V8Z M17 8H15V16H17V8Z M20 10H18V14H20V10Z"/>
        </svg>
    );
};
