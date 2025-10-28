import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import * as audioService from '../services/audioService';
import { ArticleViewerPage } from './ArticleViewerPage';

interface ArticlePageProps {
    playSound: (player: () => void) => void;
}

export interface Article {
  id: string;
  titleKey: string;
  summaryKey: string;
  contentKey: string;
  author: string;
  category: 'story' | 'article';
  voice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
}

const articlesData: Article[] = [
    {
        id: 'huggingface-outage',
        titleKey: 'articles.huggingfaceOutage.title',
        summaryKey: 'articles.huggingfaceOutage.summary',
        contentKey: 'articles.huggingfaceOutage.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Fenrir',
    },
    {
        id: 'beta-development',
        titleKey: 'articles.betaDevelopment.title',
        summaryKey: 'articles.betaDevelopment.summary',
        contentKey: 'articles.betaDevelopment.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'update-ai-apps',
        titleKey: 'articles.updateAiApps.title',
        summaryKey: 'articles.updateAiApps.summary',
        contentKey: 'articles.updateAiApps.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'oauth-explanation',
        titleKey: 'articles.oauthExplanation.title',
        summaryKey: 'articles.oauthExplanation.summary',
        contentKey: 'articles.oauthExplanation.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'huggingface-intro',
        titleKey: 'articles.huggingFaceIntro.title',
        summaryKey: 'articles.huggingFaceIntro.summary',
        contentKey: 'articles.huggingFaceIntro.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'veo31-status-update',
        titleKey: 'articles.veo31StatusUpdate.title',
        summaryKey: 'articles.veo31StatusUpdate.summary',
        contentKey: 'articles.veo31StatusUpdate.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Fenrir',
    },
    {
        id: 'sora2-story',
        titleKey: 'articles.sora2Story.title',
        summaryKey: 'articles.sora2Story.summary',
        contentKey: 'articles.sora2Story.content',
        author: 'The Storyteller AI',
        category: 'story',
        voice: 'Kore',
    },
    {
        id: 'github-reupload',
        titleKey: 'articles.githubReupload.title',
        summaryKey: 'articles.githubReupload.summary',
        contentKey: 'articles.githubReupload.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'downloadable-features-incomplete',
        titleKey: 'articles.downloadableFeaturesIncomplete.title',
        summaryKey: 'articles.downloadableFeaturesIncomplete.summary',
        contentKey: 'articles.downloadableFeaturesIncomplete.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'feature-summary-update',
        titleKey: 'articles.featureSummaryUpdate.title',
        summaryKey: 'articles.featureSummaryUpdate.summary',
        contentKey: 'articles.featureSummaryUpdate.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'emulator-support',
        titleKey: 'articles.emulatorSupport.title',
        summaryKey: 'articles.emulatorSupport.summary',
        contentKey: 'articles.emulatorSupport.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'ai-game-creator',
        titleKey: 'articles.aiGameCreator.title',
        summaryKey: 'articles.aiGameCreator.summary',
        contentKey: 'articles.aiGameCreator.content',
        author: 'The Storyteller AI',
        category: 'story',
        voice: 'Kore',
    },
    {
        id: 'minesweeper-release',
        titleKey: 'articles.minesweeperRelease.title',
        summaryKey: 'articles.minesweeperRelease.summary',
        contentKey: 'articles.minesweeperRelease.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Puck',
    },
     {
        id: 'offline-ai-changes',
        titleKey: 'articles.offlineAiChanges.title',
        summaryKey: 'articles.offlineAiChanges.summary',
        contentKey: 'articles.offlineAiChanges.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'workshop-sound-update',
        titleKey: 'articles.workshopSoundUpdate.title',
        summaryKey: 'articles.workshopSoundUpdate.summary',
        contentKey: 'articles.workshopSoundUpdate.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'new-feature-early-release',
        titleKey: 'articles.newFeatureEarlyRelease.title',
        summaryKey: 'articles.newFeatureEarlyRelease.summary',
        contentKey: 'articles.newFeatureEarlyRelease.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'github-release-prediction',
        titleKey: 'articles.githubRelease.title',
        summaryKey: 'articles.githubRelease.summary',
        contentKey: 'articles.githubRelease.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'deepchatpro2-announcement',
        titleKey: 'articles.deepChatPro2.title',
        summaryKey: 'articles.deepChatPro2.summary',
        contentKey: 'articles.deepChatPro2.content',
        author: 'AiApps team',
        category: 'article',
        voice: 'Fenrir',
    },
    {
        id: 'introducing-new-model',
        titleKey: 'articles.introducingNewModel.title',
        summaryKey: 'articles.introducingNewModel.summary',
        contentKey: 'articles.introducingNewModel.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'github-announcement',
        titleKey: 'articles.githubAnnouncement.title',
        summaryKey: 'articles.githubAnnouncement.summary',
        contentKey: 'articles.githubAnnouncement.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'veo3-status',
        titleKey: 'articles.veo3Status.title',
        summaryKey: 'articles.veo3Status.summary',
        contentKey: 'articles.veo3Status.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Fenrir',
    },
    {
        id: 'gemini-api-info',
        titleKey: 'articles.geminiApiInfo.title',
        summaryKey: 'articles.geminiApiInfo.summary',
        contentKey: 'articles.geminiApiInfo.content',
        author: 'The Developer',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'human-vs-ai-story',
        titleKey: 'articles.humanVsAiStory.title',
        summaryKey: 'articles.humanVsAiStory.summary',
        contentKey: 'articles.humanVsAiStory.content',
        author: 'The Storyteller AI',
        category: 'story',
        voice: 'Kore',
    },
    {
        id: 'future-discontinuation',
        titleKey: 'articles.futureDiscontinuation.title',
        summaryKey: 'articles.futureDiscontinuation.summary',
        contentKey: 'articles.futureDiscontinuation.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Charon',
    },
    {
        id: 'potential-shutdown',
        titleKey: 'articles.potentialShutdown.title',
        summaryKey: 'articles.potentialShutdown.summary',
        contentKey: 'articles.potentialShutdown.content',
        author: 'The Core',
        category: 'article',
        voice: 'Kore',
    },
    {
        id: 'final-transmission',
        titleKey: 'articles.finalTransmission.title',
        summaryKey: 'articles.finalTransmission.summary',
        contentKey: 'articles.finalTransmission.content',
        author: 'The Core',
        category: 'article',
        voice: 'Charon',
    },
// FIX: Completed the truncated object in the articlesData array.
    {
        id: 'sound-library-update',
        titleKey: 'articles.soundLibraryUpdate.title',
        summaryKey: 'articles.soundLibraryUpdate.summary',
        contentKey: 'articles.soundLibraryUpdate.content',
        author: 'The Development Team',
        category: 'article',
        voice: 'Zephyr',
    },
];

export const ArticlePage: React.FC<ArticlePageProps> = ({ playSound }) => {
    const { t } = useLanguage();
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const handleSelectArticle = (article: Article) => {
        playSound(audioService.playClick);
        setSelectedArticle(article);
    };
    
    const categories = useMemo(() => {
        const cats = new Set(articlesData.map(a => a.category));
        return ['all', ...Array.from(cats)];
    }, []);
    const [filter, setFilter] = useState('all');

    const filteredArticles = useMemo(() => {
        if (filter === 'all') return articlesData;
        return articlesData.filter(a => a.category === filter);
    }, [filter]);

    if (selectedArticle) {
        return (
            <ArticleViewerPage
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                playSound={playSound}
            />
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">Articles & Stories</h1>
            
            <div className="w-full max-w-4xl mb-6 flex justify-center gap-2 font-press-start">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 border-2 text-xs capitalize ${filter === cat ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map(article => (
                    <button 
                        key={article.id} 
                        onClick={() => handleSelectArticle(article)}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        className="w-full text-left p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow"
                    >
                        <h3 className="font-press-start text-base text-brand-yellow">{t(article.titleKey)}</h3>
                        <p className="font-sans text-xs text-brand-light/70 mt-1">by {article.author}</p>
                        <p className="font-sans text-sm text-brand-light/90 mt-2">{t(article.summaryKey)}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};