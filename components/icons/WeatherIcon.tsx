import React from 'react';

export const WeatherIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Sun */}
        <path fill="#ffff00" d="M8 4H10V6H8V4Z M4 8H6V10H4V8Z M8 12H10V14H8V12Z M12 8H14V10H12V8Z"/>
        {/* Cloud */}
        <path d="M10 12H18V13H20V15H21V18H20V19H18V20H10V19H8V18H7V15H8V13H10V12Z"/>
    </svg>
);