


import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { CurrentPage } from '../App';

// Icons
import { GamepadIcon } from './icons/GamepadIcon';
import { ChatIcon } from './icons/ChatIcon';
import { OfflineAiIcon } from './icons/OfflineAiIcon';
import { ArticleIcon } from './ArticleIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HomePageProps {
  onSetPage: (page: CurrentPage) => void;
  onOpenSettings: () => void;
}

const AppLauncherButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ label, icon, onClick }) => (
    <button 
        onClick={onClick}
        aria-label={`Open ${label}`}
        className="flex flex-col items-center justify-center text-center gap-4 p-6 bg-surface-1 border-2 border-border-primary rounded-lg shadow-lg transition-all transform hover:scale-105 hover:bg-brand-cyan/20 hover:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-primary"
    >
        <div className="w-16 h-16 text-brand-primary">{icon}</div>
        <span className="font-press-start text-text-primary text-sm sm:text-base">{label}</span>
    </button>
);


export const HomePage: React.FC<HomePageProps> = ({ onSetPage, onOpenSettings }) => {
    const { t } = useLanguage();

    const apps = [
        { page: 'minigameHub', label: t('sidebar.aiZone'), icon: <GamepadIcon className="w-full h-full" /> },
        { page: 'aiChat', label: t('sidebar.aiChat'), icon: <ChatIcon className="w-full h-full" /> },
        { page: 'offlineAi', label: t('sidebar.offlineAi'), icon: <OfflineAiIcon className="w-full h-full" /> },
        { page: 'article', label: t('sidebar.article'), icon: <ArticleIcon className="w-full h-full" /> },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-4 animate-page-enter relative">
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={onOpenSettings}
                    aria-label={t('header.settings')}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-1 border-2 border-border-primary text-text-primary hover:bg-brand-primary hover:text-text-inverted transition-all"
                >
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </div>

             <h1 className="text-3xl sm:text-5xl text-brand-primary font-press-start text-center mb-10">
                {t('header.title')} {t('sidebar.home')}
            </h1>
            <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {apps.map(app => (
                     <AppLauncherButton
                        key={app.page}
                        label={app.label}
                        icon={app.icon}
                        onClick={() => onSetPage(app.page as CurrentPage)}
                    />
                ))}
            </div>
        </div>
    );
};