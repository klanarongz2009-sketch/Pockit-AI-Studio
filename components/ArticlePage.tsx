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
    {
        id: 'sound-library-update',
        titleKey: 'articles.soundLibraryUpdate.title',
        summaryKey: 'articles.soundLibraryUpdate.summary',
        contentKey: 'articles.soundLibraryUpdate.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'message-from-the-core',
        titleKey: 'articles.messageFromTheCore.title',
        summaryKey: 'articles.messageFromTheCore.summary',
        contentKey: 'articles.messageFromTheCore.content',
        author: '[REDACTED]',
        category: 'article',
        voice: 'Charon',
    },
    {
        id: 'music-update',
        titleKey: 'articles.musicUpdate.title',
        summaryKey: 'articles.musicUpdate.summary',
        contentKey: 'articles.musicUpdate.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'update_ai_apps',
        titleKey: 'articles.updateAiApps.title',
        summaryKey: 'articles.updateAiApps.summary',
        contentKey: 'articles.updateAiApps.content',
        author: 'AI APPS Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'map-model-removal',
        titleKey: 'articles.mapModelRemoval.title',
        summaryKey: 'articles.mapModelRemoval.summary',
        contentKey: 'articles.mapModelRemoval.content',
        author: 'AI Universe Team',
        category: 'article',
        voice: 'Zephyr',
    },
    {
        id: 'update-2.54',
        titleKey: 'articles.update2_54.title',
        summaryKey: 'articles.update2_54.summary',
        contentKey: 'articles.update2_54.content',
        author: 'AI Universe Team',
        category: 'article',
        voice: 'Fenrir',
    },
    {
        id: 'useless-game-creation',
        titleKey: 'articles.uselessGameCreation.title',
        summaryKey: 'articles.uselessGameCreation.summary',
        contentKey: 'articles.uselessGameCreation.content',
        author: 'The Storyteller AI',
        category: 'story',
        voice: 'Kore',
    },
    {
        id: 'glitch-in-pixel-painter',
        titleKey: 'articles.glitchPixelPainter.title',
        summaryKey: 'articles.glitchPixelPainter.summary',
        contentKey: 'articles.glitchPixelPainter.content',
        author: 'The Storyteller AI',
        category: 'story',
        voice: 'Puck',
    },
];

export const ArticlePage: React.FC<ArticlePageProps> = ({ playSound }) => {
    const { t } = useLanguage();
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const openArticle = (article: Article) => {
        playSound(audioService.playClick);
        setSelectedArticle(article);
    };

    const closeArticle = () => {
        playSound(audioService.playCloseModal);
        setSelectedArticle(null);
    };

    const groupedArticles = useMemo(() => {
        return articlesData.reduce((acc, article) => {
            const category = article.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(article);
            return acc;
        }, {} as Record<'story' | 'article', Article[]>);
    }, []);

    if (selectedArticle) {
        return <ArticleViewerPage article={selectedArticle} onClose={closeArticle} playSound={playSound} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">{t('articlePage.title')}</h1>
            
            <div className="w-full max-w-3xl space-y-8">
                {(Object.entries(groupedArticles) as [string, Article[]][]).map(([category, articles]) => (
                    <div key={category}>
                        <h2 className="font-press-start text-2xl text-brand-cyan mb-4">
                            {category === 'story' ? t('articlePage.categoryStory') : t('articlePage.categoryArticle')}
                        </h2>
                        <div className="space-y-4">
                            {articles.map(article => (
                                <button 
                                    key={article.id}
                                    onClick={() => openArticle(article)}
                                    className="w-full text-left p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1"
                                >
                                    <h3 className="font-press-start text-lg text-brand-yellow">{t(article.titleKey)}</h3>
                                    <p className="font-sans text-sm text-brand-light/80 mt-2">{t(article.summaryKey)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
