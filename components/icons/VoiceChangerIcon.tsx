
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
            {/* Person Icon */}
            <path d="M12 4H14V6H12V4Z" />
            <path d="M11 6H15V8H11V6Z" />
            <path d="M10 8H16V12H10V8Z" />
            {/* Sound Waves */}
            <path d="M4 10H6V14H4V10Z" />
            <path d="M7 8H9V16H7V8Z" />
            <path d="M17 8H19V16H17V8Z" />
            <path d="M20 10H22V14H20V10Z" />
            {/* Base */}
            <path d="M8 18H18V20H8V18Z" />
        </svg>
    );
};
