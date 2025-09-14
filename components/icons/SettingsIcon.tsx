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
            <path d="M11 4H13V6H11V4Z M18 9H20V11H18V9Z M18 13H20V15H18V13Z M11 18H13V20H11V18Z M6 9H4V11H6V9Z M6 13H4V15H6V13Z M9 6H11V4H9V6Z M15 6H13V4H15V6Z M15 18H13V20H15V18Z M9 18H11V20H9V18Z M8 9V7H6V9H8Z M16 9V7H18V9H16Z M16 15V17H18V15H16Z M8 15V17H6V15H8Z M16 8H8V16H16V8Z"/>
            <path fill="var(--color-bg, black)" d="M14 10H10V14H14V10Z"/>
        </svg>
    );
};
