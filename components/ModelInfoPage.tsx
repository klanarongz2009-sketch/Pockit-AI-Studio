import React from 'react';
import { PageHeader, PageWrapper } from './PageComponents';

interface ModelInfoPageProps {
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="w-full bg-black/20 p-4 border-2 border-brand-light/30 space-y-2">
        <h3 className="font-press-start text-base sm:text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

export const ModelInfoPage: React.FC<ModelInfoPageProps> = ({ onClose }) => {
    return (
        <PageWrapper>
            <PageHeader title="About Our AI Models" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                <Section title="A Dynamic Universe of AI">
                    <p>
                        The list of AI Assistants you see in this app is not static. It's a living, evolving collection designed to bring you the best and most interesting capabilities from the world of generative AI. Our goal is to provide a diverse range of tools that are powerful, useful, and fun to interact with.
                    </p>
                    <p>
                        This means that from time to time, you'll see new models appear, existing models get updated, or some models get removed. Here's a deeper look into why that happens.
                    </p>
                </Section>
                <Section title="Why are new models added?">
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>New Technology:</strong> The field of AI is moving incredibly fast. When new, more capable base models are released (like new versions of Gemini), we integrate them to give you access to the latest advancements in reasoning, creativity, and speed.
                        </li>
                        <li>
                            <strong>New Use Cases:</strong> We are constantly exploring new ways AI can help. We might add a specialized model like a 'Music Theory Expert' or a 'Game Design Consultant' if we see an opportunity to provide a unique and valuable tool.
                        </li>
                        <li>
                            <strong>User Feedback:</strong> Your feedback is crucial! If we see a high demand for a specific type of assistant (for example, a 'Storyboarding AI'), we will prioritize its development and add it to the roster.
                        </li>
                    </ul>
                </Section>
                <Section title="Why are models edited or updated?">
                     <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>Improved Instructions:</strong> The "personality" and expertise of an AI assistant come from its system instruction. We are always refining these instructions to make the assistants more helpful, more accurate, and better at their specific tasks. A small change to an instruction can lead to a big improvement in performance.
                        </li>
                        <li>
                            <strong>Upgrading the Base Model:</strong> An assistant like 'Creative Writer' might initially be built on one version of Gemini. When a better version becomes available, we may upgrade the assistant to use the new base model, enhancing its abilities while keeping its core purpose the same.
                        </li>
                         <li>
                            <strong>Adding Capabilities:</strong> We might enhance an existing model with new tools. For example, a general chat model could be updated to gain web search capabilities, making it more knowledgeable about current events.
                        </li>
                    </ul>
                </Section>
                 <Section title="Why are models removed?">
                     <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>Deprecation:</strong> Sometimes, the underlying AI technology that a model is built on becomes outdated and is replaced by a newer, better version. To ensure the best experience, we retire models that rely on deprecated technology.
                        </li>
                        <li>
                            <strong>Consolidation:</strong> We might find that two separate models have overlapping functionalities. To simplify the user experience, we may merge their capabilities into a single, more powerful model and remove the redundant ones.
                        </li>
                         <li>
                            <strong>Lack of Use:</strong> If a particular experimental model isn't being used very much, we may remove it to keep the selection focused on the tools that provide the most value to our users.
                        </li>
                    </ul>
                </Section>
                <Section title="Our Commitment">
                    <p>
                        Our promise is to keep this app at the forefront of creative AI technology. We will continue to experiment, refine, and update our collection of AI assistants to ensure you always have access to the best tools for bringing your ideas to life. Thank you for being part of this creative journey!
                    </p>
                </Section>
            </main>
        </PageWrapper>
    );
};
