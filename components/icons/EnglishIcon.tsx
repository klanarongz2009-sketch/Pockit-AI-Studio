
import React from 'react';

export const EnglishIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Globe Outline */}
            <path d="M12 4H14V5H15V6H16V8H17V16H16V18H15V19H14V20H10V19H9V18H8V16H7V8H8V6H9V5H10V4H12Z" />
            <path fill="black" d="M12 4V20" />
            <path fill="black" d="M7 8H17V16H7V8Z" />
            <path fill="black" d="M10 4H12V5H14V6H15V8H16V16H15V18H14V19H12V20H10V19H9V18H8V16H7V8H8V6H9V5H10V4Z" />
            <path d="M12 6H14V8H12V6Z" />
            <path d="M12 16H14V18H12V16Z" />
            <path d="M9 9H11V11H9V9Z" />
            <path d="M9 13H11V15H9V13Z" />
        </svg>
    );
};
