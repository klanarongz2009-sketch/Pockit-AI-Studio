import React from 'react';

export const GemAiIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none"
        className={className} 
    >
        <defs>
            <linearGradient id="gem-main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-brand-primary)" />
                <stop offset="100%" stopColor="var(--color-brand-secondary)" />
            </linearGradient>
        </defs>
        <path d="M12 2L4 8.5V15.5L12 22L20 15.5V8.5L12 2Z" fill="url(#gem-main-grad)" />
        <path d="M12 2V22" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
        <path d="M4 8.5L20 15.5" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
        <path d="M4 15.5L20 8.5" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
        
        {/* Top facet shine */}
        <path d="M12 2L4 8.5L12 8.5Z" fill="white" fillOpacity="0.3" />
        <path d="M12 2L20 8.5L12 8.5Z" fill="white" fillOpacity="0.1" />
    </svg>
);