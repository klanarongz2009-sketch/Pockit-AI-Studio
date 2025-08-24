
import React from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import { SparklesIcon } from './icons/SparklesIcon';
import { GamepadIcon } from './icons/GamepadIcon';

interface EnglishGuidePageProps {
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="w-full bg-black/20 p-4 border-2 border-brand-light/30 space-y-2">
        <h3 className="font-press-start text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

export const EnglishGuidePage: React.FC<EnglishGuidePageProps> = ({ onClose }) => (
    <PageWrapper>
        <PageHeader title="English Guide" onBack={onClose} />
        <main className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
            <Section title="Welcome!">
                <p>
                    Welcome to the Portable AI Studio, your digital playground! This studio is packed with creative AI tools and technical resources to assist you. Our mission is to turn your brilliant ideas into reality with AI. Powered by Google AI, let's create something amazing together!
                </p>
            </Section>

            <Section title="AI Tips & Secrets">
                <h4 className="font-press-start text-base text-brand-yellow">Keyboard Shortcuts</h4>
                <p className="text-xs text-brand-light/80">Use these shortcuts to work like a pro! (Ctrl for Windows/Linux, Cmd for Mac)</p>
                <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                    <li><strong className="text-brand-cyan">Ctrl + Enter:</strong> Generate content on various pages (Image, Song, Sound FX, Video, Feedback Analysis).</li>
                    <li><strong className="text-brand-cyan">Alt + U:</strong> Open the file upload dialog (in Voice Changer, Video Editor).</li>
                    <li><strong className="text-brand-cyan">Alt + P:</strong> Play/Stop the generated audio or song.</li>
                    <li><strong className="text-brand-cyan">Alt + D:</strong> Download your creation.</li>
                    <li><strong className="text-brand-cyan">Alt + S:</strong> Get prompt suggestions from AI (in Image Generator).</li>
                    <li><strong className="text-brand-cyan">Alt + C:</strong> Clear all data on the Image Generator page.</li>
                </ul>
                 <h4 className="font-press-start text-base text-brand-yellow pt-4">Pro-Tips</h4>
                 <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                    <li><strong>Specificity is Key:</strong> When generating images, try adding details about "style" (e.g., photograph, oil painting, 8-bit) or "perspective" (e.g., wide shot, close-up) for more accurate results.</li>
                    <li><strong>Combine Powers:</strong> Create a character image -> generate a theme song from that image -> create sound effects -> you now have the core assets for a multimedia project!</li>
                 </ul>

                <div className="flex gap-4 items-start pt-4 mt-4 border-t-2 border-brand-light/20">
                    <div className="flex-shrink-0 w-10 h-10 text-brand-magenta mt-1"><GamepadIcon/></div>
                    <div>
                        <h4 className="font-press-start text-base text-brand-magenta">Secret Feature: Pixel Dodge Minigame!</h4>
                        <p className="text-xs text-brand-light/80">
                            Feeling bored? In the Image Generator, try adding the magic words <strong className="text-brand-yellow">"Let's play"</strong> to the end of your prompt! The AI will create an obstacle-dodging minigame for you on the fly, with the hero and obstacle designed based on your prompt. See what high score you can get!
                        </p>
                    </div>
                </div>
            </Section>
            
            <Section title="Frequently Asked Questions (FAQ)">
                <h4 className="font-bold">What is the AI Chat feature?</h4>
                <p className="text-xs text-brand-light/80 mb-2">The AI Chat is your creative assistant. It's powered by an AI expert in generative art, video, music, and sound design. Ask it for ideas, guidance on using the tools, or creative inspiration for your projects.</p>
                <h4 className="font-bold">What technology powers this app?</h4>
                <p className="text-xs text-brand-light/80 mb-2">The heart of this app is the Gemini API, an advanced AI model from Google. We use it to analyze, interpret, and generate creative content from your prompts, from static images to videos and sounds.</p>
                 <h4 className="font-bold">Is my data safe?</h4>
                <p className="text-xs text-brand-light/80 mb-2">Absolutely. This is a demo application. No personal data, uploaded files, or generated creations are stored on any server. Everything is processed on the fly and is gone when you close the tab.</p>
            </Section>

            <Section title="Disclaimer">
                <p>
                    AI does its best, but sometimes the generated results can be unexpected or not entirely accurate. Please use your judgment when using and sharing your creations. Have fun creating!
                </p>
            </Section>
        </main>
    </PageWrapper>
);
