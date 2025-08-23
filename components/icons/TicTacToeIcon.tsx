
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
            {/* O */}
            <path d="M9 4H15V6H9V4Z" />
            <path d="M7 6H9V12H7V6Z" />
            <path d="M15 6H17V12H15V6Z" />
            <path d="M9 12H15V14H9V12Z" />

            {/* X */}
            <path d="M4 16H6V18H4V16Z" />
            <path d="M6 18H8V20H6V18Z" />
            <path d="M8 20H10V22H8V20Z" />
            <path d="M8 16H10V18H8V16Z" />
            <path d="M6 20H8V22H6V20Z" />
            <path d="M4 20H6V22H4V20Z" />
            <path d="M2 18H4V20H2V18Z" />
            <path d="M2 20H0V18H2V20Z" />

            {/* Grid Lines */}
            <path fill="rgba(240,240,240,0.5)" d="M18 3H19V21H18V3Z" />
            <path fill="rgba(240,240,240,0.5)" d="M3 9H21V10H3V9Z" />
        </svg>
    );
};
