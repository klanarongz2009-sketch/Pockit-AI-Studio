import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { useLanguage } from '../contexts/LanguageContext';

interface ArchivePageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveItem = 'hub';

export const ArchivePage: React.FC<ArchivePageProps> = ({ playSound, isOnline }) => {
    const [activeItem, setActiveItem] = useState<ActiveItem>('hub');
    const { t } = useLanguage();
    
    const handleLaunchItem = (item: ActiveItem) => {
        playSound(audioService.playClick);
        setActiveItem(item);
    };

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-2">{t('archivePage.title')}</h1>
            <p className="text-sm text-center text-brand-light/80 mb-6">{t('archivePage.description')}</p>
            
            <div className="w-full max-w-4xl flex-grow font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Archived items will be listed here. */}
                </div>
                <p className="text-center font-press-start text-brand-light/50 mt-8">
                    There are no archived items at this time.
                </p>
            </div>
        </div>
    );
};
