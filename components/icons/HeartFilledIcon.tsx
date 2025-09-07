
import React from 'react';

export const HeartFilledIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M7 4H9V5H10V6H14V5H15V4H17V5H18V7H19V9H18V12H17V14H12V19H7V14H6V12H5V9H6V7H7V4Z" />
        </svg>
    );
};
