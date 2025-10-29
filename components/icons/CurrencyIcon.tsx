import React from 'react';

export const CurrencyIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Dollar Sign */}
        <path d="M10 4H14V6H12V8H14V10H12V11H15V13H12V14H14V16H12V18H10V16H12V14H9V12H12V10H10V8H12V6H10V4Z"/>
        {/* Yen/Yuan Sign */}
        <path d="M4 8H8V10H6V12H8V14H6V16H4V14H2V12H4V10H2V8H4Z"/>
        {/* Euro Sign */}
        <path d="M16 8H22V10H18V11H21V13H18V14H22V16H16V14H17V12H17V11H17V10H16V8Z"/>
    </svg>
);