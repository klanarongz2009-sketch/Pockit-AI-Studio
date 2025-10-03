import React from 'react';
import { PageHeader, PageWrapper } from './PageComponents';

interface UpdateInfoPageProps {
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="w-full bg-black/20 p-4 border-2 border-brand-light/30 space-y-2">
        <h3 className="font-press-start text-base sm:text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

export const UpdateInfoPage: React.FC<UpdateInfoPageProps> = ({ onClose }) => {
    return (
        <PageWrapper>
            <PageHeader title="About Application Updates" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                <Section title="A Dynamic Universe of AI">
                    <p>
                        Welcome to the Creative AI Universe! This application is not a static product; it's a living, evolving platform designed to bring you the best and most interesting capabilities from the world of generative AI. Our mission is to provide a diverse range of tools that are powerful, useful, and fun to interact with.
                    </p>
                    <p>
                        This means that from time to time, you'll see new models appear, existing models get updated, or some models get removed. We believe in rapid, iterative development to keep the experience fresh and at the cutting edge. Here's a deeper look into our update philosophy.
                    </p>
                </Section>
                <Section title="Why We Update Frequently">
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>New Technology:</strong> The field of AI is moving incredibly fast. When new, more capable base models are released (like new versions of Gemini), we integrate them to give you access to the latest advancements in reasoning, creativity, and speed. We don't want you to miss out on the latest breakthroughs.
                        </li>
                        <li>
                            <strong>New Use Cases & Features:</strong> We are constantly exploring new ways AI can help. We might add a specialized model like a 'Music Theory Expert', a new game like 'Pixel Jumper', or a new utility like the 'Device Spy'. Our goal is to continuously expand the creative toolkit available to you.
                        </li>
                        <li>
                            <strong>User Feedback:</strong> Your feedback is crucial! If we see a high demand for a specific type of assistant (for example, a 'Storyboarding AI') or a feature, we will prioritize its development and add it to the roster. This app is built for you, and your input shapes its future.
                        </li>
                         <li>
                            <strong>Bug Fixes & Performance:</strong> We are committed to providing a stable and smooth experience. Updates often include important bug fixes, performance enhancements, and optimizations to make the app faster and more reliable.
                        </li>
                    </ul>
                </Section>
                <Section title="What to Expect from Updates">
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
                 <Section title="Why Models Might Be Removed">
                     <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>Deprecation:</strong> Sometimes, the underlying AI technology that a model is built on becomes outdated and is replaced by a newer, better version. To ensure the best experience, we retire models that rely on deprecated technology.
                        </li>
                        <li>
                            <strong>Consolidation:</strong> We might find that two separate models have overlapping functionalities. To simplify the user experience, we may merge their capabilities into a single, more powerful model and remove the redundant ones.
                        </li>
                         <li>
                            <strong>Focusing on Value:</strong> If a particular experimental model isn't being used very much or doesn't provide significant value, we may remove it to keep the selection focused on the tools that are most impactful for our users.
                        </li>
                    </ul>
                </Section>
                <Section title="Our Commitment">
                    <p>
                        Our promise is to keep this app at the forefront of creative AI technology. We will continue to experiment, refine, and update our collection of AI assistants and tools to ensure you always have access to the best for bringing your ideas to life. Thank you for being part of this creative journey!
                    </p>
                </Section>
            </main>
        </PageWrapper>
    );
};
