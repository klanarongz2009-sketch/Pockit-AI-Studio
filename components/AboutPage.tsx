



import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { InstallIcon } from './icons/InstallIcon';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';
import * as audioService from '../services/audioService';
import { analyzeFeedback } from '../services/geminiService';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import { EnglishIcon } from './icons/EnglishIcon';
import { EnglishGuidePage } from './EnglishGuidePage';
import { PageHeader, PageWrapper } from './PageComponents';

interface AboutPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode; id: string }> = ({ title, children, id }) => (
    <section id={id} aria-labelledby={`${id}-heading`} className="w-full bg-surface-primary p-4 border-4 border-border-secondary shadow-pixel space-y-2">
        <h3 id={`${id}-heading`} className="font-press-start text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

const InstructionStep: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <li className="flex gap-4 items-center">
        {icon && <div className="flex-shrink-0 w-8 h-8 text-brand-yellow">{icon}</div>}
        <p className="text-text-primary/90">{children}</p>
    </li>
);

const ThreeDotsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
        <path d="M12 10H14V14H12V10Z" />
        <path d="M12 4H14V8H12V4Z" />
        <path d="M12 16H14V20H12V16Z" />
    </svg>
);

const FeedbackSection: React.FC<{ playSound: (player: () => void) => void; isOnline: boolean; }> = ({ playSound, isOnline }) => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [wasAnalyzed, setWasAnalyzed] = useState(false);
    const { spendCredits, credits } = useCredits();

    const handleAnalyze = async () => {
        if (!feedback.trim() || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.FEEDBACK_ANALYSIS)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.FEEDBACK_ANALYSIS} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playClick);
        setIsSummaryLoading(true);
        setError(null);
        setSummary(null);

        try {
            const result = await analyzeFeedback(feedback);
            setSummary(result);
            setWasAnalyzed(true);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์';
            setError(errorMessage);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!feedback.trim() || !isOnline) return;
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            playSound(audioService.playSuccess);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div className="text-center space-y-4 p-4 bg-surface-primary border-4 border-brand-lime shadow-pixel">
                <h3 className="font-press-start text-xl text-brand-lime">ขอบคุณ!</h3>
                {wasAnalyzed ? (
                    <p>ขอบคุณสำหรับข้อเสนอแนะ! ในแอปพลิเคชันเวอร์ชันเต็ม ข้อความที่ผ่านการวิเคราะห์นี้จะถูกส่งไปยัง AI Code Assistant โดยอัตโนมัติเพื่อช่วยในการพัฒนาต่อไป</p>
                ) : (
                    <p>เราได้รับข้อเสนอแนะของคุณแล้ว และจะนำไปใช้เพื่อปรับปรุงแอปพลิเคชันต่อไป!</p>
                )}
            </div>
        );
    }
    
    return (
        <>
            <p className="text-sm text-center text-text-secondary">
                เราให้ความสำคัญกับความคิดเห็นของคุณ! โปรดบอกเราว่าคุณคิดอย่างไรกับแอปนี้ หรือมีไอเดียอะไรอยากจะแนะนำ
            </p>
            <div className="w-full flex flex-col gap-4 bg-surface-primary p-4 border-2 border-border-secondary shadow-pixel">
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="พิมพ์ความคิดเห็นของคุณที่นี่..."
                    className="w-full h-40 p-2 bg-text-primary text-background rounded-none border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                    disabled={isLoading || !isOnline}
                    aria-label="ช่องใส่ข้อเสนอแนะ"
                />
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleAnalyze}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-border-primary shadow-sm transition-all hover:bg-brand-yellow disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isSummaryLoading ? 'กำลังวิเคราะห์...' : `วิเคราะห์ด้วย AI (${CREDIT_COSTS.FEEDBACK_ANALYSIS} เครดิต)`}
                    </button>
                    <button
                        onClick={handleSubmit}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-brand-magenta text-white border-2 border-border-primary shadow-sm transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-5 h-5" />
                        {isLoading ? 'กำลังส่ง...' : (summary ? 'ส่งให้ AI Code Assistant' : 'ส่งข้อเสนอแนะ')}
                    </button>
                </div>
            </div>

            {isSummaryLoading && <LoadingSpinner text="AI กำลังอ่าน..." />}
            
            {error && (
                <div role="alert" className="w-full p-3 text-center text-sm text-text-primary bg-brand-magenta/20 border-2 border-brand-magenta">
                    {error}
                </div>
            )}

            {summary && (
                <div aria-live="polite" className="w-full p-4 bg-black/30 border-2 border-brand-cyan/50 space-y-2">
                    <h4 className="font-press-start text-brand-cyan">AI สรุปว่า:</h4>
                    <p className="text-sm">"{summary}"</p>
                </div>
            )}
        </>
    );
};


export const AboutPage: React.FC<AboutPageProps> = ({ onClose, playSound, isOnline }) => {
    const [showEnglishGuide, setShowEnglishGuide] = useState(false);

    if (showEnglishGuide) {
        return <EnglishGuidePage onClose={() => {
            playSound(audioService.playCloseModal);
            setShowEnglishGuide(false);
        }} />;
    }

    return (
        <PageWrapper>
            <PageHeader title="เกี่ยวกับแอปพลิเคชัน" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans px-2 pb-8 space-y-6">
                 <div className="flex justify-end">
                    <button 
                        onClick={() => { playSound(audioService.playClick); setShowEnglishGuide(true); }}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="View English Guide"
                        className="flex-shrink-0 flex items-center gap-2 p-2 text-xs bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-colors"
                    >
                        <EnglishIcon className="w-5 h-5" />
                        <span>EN</span>
                    </button>
                </div>
                <Section title="สวัสดีครับ!" id="welcome">
                    <p>
                        ยินดีต้อนรับสู่ Ai Studio แบบพกพา สนามเด็กเล่นดิจิทัลแห่งนี้! สตูดิโอนี้มีเครื่องมือ AI สร้างสรรค์และแหล่งข้อมูลทางเทคนิคเพื่อช่วยเหลือคุณ ภารกิจของเราคือการเปลี่ยนไอเดียสุดบรรเจิดของคุณให้กลายเป็นความจริงด้วย AI ด้วยพลังของ Google AI เรามาสร้างสรรค์สิ่งที่น่าทึ่งไปด้วยกันเถอะ!
                    </p>
                </Section>

                <Section title="เคล็ดลับ & ความลับจาก AI" id="tips">
                    <h4 className="font-press-start text-base text-brand-yellow">คีย์ลัดคู่ใจ (Keyboard Shortcuts)</h4>
                    <p className="text-xs text-text-secondary">ใช้คีย์ลัดเหล่านี้เพื่อทำงานอย่างมือโปร! (Ctrl สำหรับ Windows/Linux, Cmd สำหรับ Mac)</p>
                    <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li><strong className="text-brand-cyan">Ctrl + Enter:</strong> เริ่มสร้างผลงานในหน้าต่างๆ (สร้างภาพ, เพลง, เสียงประกอบ, วิดีโอ, วิเคราะห์ข้อเสนอแนะ)</li>
                        <li><strong className="text-brand-cyan">Alt + U:</strong> เปิดหน้าต่างอัปโหลดไฟล์ (ในหน้าเปลี่ยนเสียง, ตัดต่อวิดีโอ)</li>
                        <li><strong className="text-brand-cyan">Alt + P:</strong> เล่น/หยุดเสียงหรือเพลงที่สร้างเสร็จ</li>
                        <li><strong className="text-brand-cyan">Alt + D:</strong> ดาวน์โหลดผลงานของคุณ</li>
                        <li><strong className="text-brand-cyan">Alt + S:</strong> ให้ AI ช่วยคิดไอเดียคำสั่งใหม่ๆ (ในหน้าสร้างภาพ)</li>
                        <li><strong className="text-brand-cyan">Alt + C:</strong> ล้างข้อมูลทั้งหมดในหน้าสร้างภาพ</li>
                    </ul>
                     <h4 className="font-press-start text-base text-brand-yellow pt-4">เคล็ดลับการใช้งาน</h4>
                     <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li><strong>ยิ่งเจาะจง ยิ่งดี:</strong> เวลาสร้างภาพ ลองใส่รายละเอียดเกี่ยวกับ "สไตล์" (เช่น ภาพถ่าย, ภาพวาดสีน้ำมัน, 8-bit) หรือ "มุมมอง" (เช่น มุมกว้าง, โคลสอัพ) เพื่อให้ได้ผลลัพธ์ที่ตรงใจยิ่งขึ้น</li>
                        <li><strong>ผสมผสานพลัง:</strong> สร้างภาพตัวละคร -> สร้างเพลงประกอบจากภาพ -> สร้างเสียงประกอบ -> คุณมีองค์ประกอบสำหรับโปรเจกต์มัลติมีเดียแล้ว!</li>
                     </ul>

                    <div className="flex gap-4 items-start pt-4 mt-4 border-t-2 border-border-primary/20">
                        <div className="flex-shrink-0 w-10 h-10 text-brand-magenta mt-1"><GamepadIcon/></div>
                        <div>
                            <h4 className="font-press-start text-base text-brand-magenta">ฟีเจอร์ลับ: Pixel Dodge Minigame!</h4>
                            <p className="text-xs text-text-secondary">
                                รู้สึกเบื่อไหม? ลองพิมพ์คำสั่งสร้างภาพแล้วต่อท้ายด้วยคำว่า <strong className="text-brand-yellow">"มาเล่นกัน"</strong> ดูสิ! AI จะสร้างมินิเกมหลบหลีกสิ่งกีดขวางให้คุณเล่นทันที โดยตัวละครฮีโร่และอุปสรรคจะถูกออกแบบจากคำสั่งของคุณเอง! มาดูกันว่าคุณจะทำคะแนนได้เท่าไหร่!
                            </p>
                        </div>
                    </div>
                </Section>
                
                <Section title="คู่มือการติดตั้งแอป" id="install-guide">
                    <p>
                        'Ai Studio แบบพกพา' เป็น Progressive Web App (PWA) ซึ่งหมายความว่าคุณสามารถ "ติดตั้ง" ลงบนหน้าจอหลักของอุปกรณ์ได้เหมือนแอปทั่วไป! เพื่อการเข้าถึงที่รวดเร็ว, ประสบการณ์เต็มหน้าจอ, และใช้งานบางฟีเจอร์แบบออฟไลน์ได้
                    </p>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">สำหรับ iPhone และ iPad (Safari)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                         <InstructionStep icon={<ShareIcon className="w-6 h-6" />}>
                            แตะที่ปุ่ม <strong>"แชร์"</strong> แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม"</strong>
                        </InstructionStep>
                    </ol>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">สำหรับ Android (Chrome)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<ThreeDotsIcon className="w-6 h-6" />}>
                            แตะที่เมนู <strong>(จุดสามจุด)</strong> แล้วเลือก <strong>"ติดตั้งแอป"</strong>
                        </InstructionStep>
                    </ol>
                     <h4 className="font-press-start text-sm text-brand-yellow pt-2">สำหรับคอมพิวเตอร์ (Chrome, Edge)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<InstallIcon className="w-6 h-6" />}>
                            มองหา <strong>ไอคอนติดตั้ง</strong> ในแถบที่อยู่แล้วคลิก <strong>"ติดตั้ง"</strong>
                        </InstructionStep>
                    </ol>
                </Section>

                <Section title="ข้อเสนอแนะ" id="feedback">
                    <FeedbackSection playSound={playSound} isOnline={isOnline} />
                </Section>

                <Section title="คำถามที่พบบ่อย (FAQ)" id="faq">
                    <h4 className="font-bold">แอปนี้ใช้เทคโนโลยีอะไร?</h4>
                    <p className="text-xs text-text-secondary mb-2">หัวใจของแอปนี้คือ Gemini API ซึ่งเป็นโมเดล AI ขั้นสูงจาก Google เราใช้มันในการวิเคราะห์, ตีความ, และสร้างสรรค์ผลงานจากคำสั่งของคุณ ตั้งแต่ภาพนิ่งไปจนถึงวิดีโอและเสียง</p>
                     <h4 className="font-bold">ข้อมูลของฉันปลอดภัยไหม?</h4>
                    <p className="text-xs text-text-secondary mb-2">แน่นอนครับ แอปนี้เป็นเพียงเดโมสำหรับการสาธิตเท่านั้น ไม่มีการเก็บข้อมูลส่วนตัว, ไฟล์ที่อัปโหลด, หรือผลงานที่คุณสร้างไว้บนเซิร์ฟเวอร์ ทุกอย่างจะถูกประมวลผลและหายไปเมื่อคุณปิดหน้าต่างครับ</p>
                </Section>

                <Section title="ข้อจำกัดความรับผิดชอบ" id="disclaimer">
                    <p>
                        AI พยายามอย่างเต็มที่ แต่บางครั้งผลลัพธ์ที่สร้างขึ้นอาจไม่คาดคิดหรือไม่ถูกต้องเสมอไป โปรดใช้วิจารณญาณในการใช้งานและแบ่งปันผลงานของคุณนะครับ ขอให้สนุกกับการสร้างสรรค์!
                    </p>
                </Section>
            </main>
        </PageWrapper>
    );
}