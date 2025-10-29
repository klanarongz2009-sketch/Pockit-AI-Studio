import React, { useState, useEffect, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import * as imgflipService from '../services/imgflipService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface MemeGeneratorPageProps {
  onClose: () => void;
  playSound: (player: () => void) => void;
  isOnline: boolean;
}

export const MemeGeneratorPage: React.FC<MemeGeneratorPageProps> = ({ onClose, playSound, isOnline }) => {
    const [templates, setTemplates] = useState<imgflipService.MemeTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<imgflipService.MemeTemplate | null>(null);
    const [textInputs, setTextInputs] = useState<string[]>([]);
    const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!isOnline) return;
            setIsLoading(true);
            try {
                const fetchedTemplates = await imgflipService.getMemeTemplates();
                setTemplates(fetchedTemplates);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load meme templates.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [isOnline]);

    const handleSelectTemplate = (template: imgflipService.MemeTemplate) => {
        playSound(audioService.playSelection);
        setSelectedTemplate(template);
        setTextInputs(Array(template.box_count).fill(''));
        setGeneratedMeme(null);
    };

    const handleGenerate = async () => {
        if (!selectedTemplate || isLoading) return;
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        try {
            const url = await imgflipService.createMeme(selectedTemplate.id, textInputs);
            setGeneratedMeme(url);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create meme.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedMeme) return;
        // The Imgflip API doesn't support CORS for direct download, so we open in a new tab.
        window.open(generatedMeme, '_blank');
    };

    const renderContent = () => {
        if (isLoading && templates.length === 0) {
            return <LoadingSpinner text="Fetching Meme Templates..." />;
        }

        if (error) {
            return <p className="text-brand-accent">{error}</p>;
        }

        if (selectedTemplate) {
            return (
                <div className="w-full space-y-4">
                    <button onClick={() => setSelectedTemplate(null)} className="text-sm underline hover:text-brand-yellow">&larr; Back to Templates</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            {textInputs.map((text, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    value={text}
                                    onChange={(e) => {
                                        const newInputs = [...textInputs];
                                        newInputs[index] = e.target.value;
                                        setTextInputs(newInputs);
                                    }}
                                    placeholder={`Text ${index + 1}`}
                                    className="w-full p-2 bg-surface-1 border border-border-primary"
                                    disabled={isLoading}
                                />
                            ))}
                            <button onClick={handleGenerate} disabled={isLoading} className="w-full p-3 bg-brand-magenta text-white font-press-start flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5" /> Generate
                            </button>
                        </div>
                        <div className="bg-black p-2 border-2 border-border-primary flex items-center justify-center">
                            {isLoading ? <LoadingSpinner text="Making meme..." /> : 
                             generatedMeme ? <img src={generatedMeme} alt="Generated meme" className="max-w-full max-h-64" /> :
                             <img src={selectedTemplate.url} alt={selectedTemplate.name} className="max-w-full max-h-64" />}
                        </div>
                    </div>
                    {generatedMeme && (
                        <button onClick={handleDownload} className="w-full p-2 bg-brand-yellow text-black font-press-start flex items-center justify-center gap-2">
                           <DownloadIcon className="w-5 h-5"/> Open & Save Image
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {templates.map(template => (
                    <button key={template.id} onClick={() => handleSelectTemplate(template)} className="border-2 border-transparent hover:border-brand-yellow">
                        <img src={template.url} alt={template.name} className="w-full h-full object-cover aspect-square" loading="lazy" />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <PageWrapper>
            <PageHeader title="Meme Generator" onBack={onClose} />
            <main id="main-content" className="w-full max-w-4xl flex-grow flex flex-col items-center gap-4 p-2 font-sans">
                <p className="text-sm text-center text-brand-light/80">Select a template, add your text, and generate a meme. Powered by Imgflip API.</p>
                {renderContent()}
            </main>
        </PageWrapper>
    );
};