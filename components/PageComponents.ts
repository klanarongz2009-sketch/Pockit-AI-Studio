import React from 'react';

export const PageWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    React.createElement('div', {
        className: `min-h-screen bg-black font-press-start text-brand-light p-4 sm:p-8 flex flex-col items-center ${className}`
    }, children)
);

export const PageHeader: React.FC<{ title: string; onBack: () => void; }> = ({ title, onBack }) => (
    React.createElement('header', {
        role: "banner",
        className: "w-full max-w-lg flex items-center p-3 border-b-4 border-brand-light bg-black/20 flex-shrink-0 mb-6"
    },
    React.createElement('button', {
        onClick: onBack,
        className: "text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans"
    }, '\u2190 กลับ'),
    React.createElement('h2', {
        className: "text-base sm:text-lg text-brand-yellow font-press-start"
    }, title))
);