import React from 'react';

export const AudioTranscriptionIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        {/* Sound Waves */}
        <path d="M4 10H5V14H4V10Z M6 8H7V16H6V8Z M8 5H9V19H8V5Z"/>
        {/* Arrow */}
        <path d="M11 11H15V13H11V11Z M14 10L16 12L14 14V10Z" />
        {/* Document */}
        <path d="M17 6H21V18H17V6Z"/>
        <path fill="var(--color-bg, black)" d="M18 8H20V9H18V8Z M18 11H20V12H18V11Z M18 14H20V15H18V14Z" />
    </svg>
);