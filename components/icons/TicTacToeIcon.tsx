import React from 'react';

export const TicTacToeIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M8 3H10V21H8V3Z M14 3H16V21H14V3Z M3 8H21V10H3V8Z M3 14H21V16H3V14Z"/>
            <path fill="#00ffff" d="M4 4L7 7L4 10L5 11L8 8L11 11L12 10L9 7L12 4L11 3L8 6L5 3L4 4Z"/>
            <path fill="#ffff00" d="M13 13H15V14H17V16H15V17H13V16H11V14H13V13Z M12 15H16V19H12V15Z M13 14H12V14Z"/>
            <path fill="var(--color-bg, black)" d="M13 15H15V18H13V15Z"/>
        </svg>
    );
};
