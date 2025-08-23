import React from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import { ShareIcon } from './icons/ShareIcon';
import { InstallIcon } from './icons/InstallIcon';

interface InstallGuidePageProps {
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="w-full bg-black/20 p-4 border-2 border-brand-light/30 space-y-3">
        <h3 className="font-press-start text-base sm:text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

const InstructionStep: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <li className="flex gap-4 items-center">
        {icon && <div className="flex-shrink-0 w-8 h-8 text-brand-yellow">{icon}</div>}
        <p className="text-brand-light/90">{children}</p>
    </li>
);

// A simple three-dots icon for Android instructions
const ThreeDotsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
        <path d="M12 10H14V14H12V10Z" />
        <path d="M12 4H14V8H12V4Z" />
        <path d="M12 16H14V20H12V16Z" />
    </svg>
);


export const InstallGuidePage: React.FC<InstallGuidePageProps> = ({ onClose }) => (
    <PageWrapper>
        <PageHeader title="คู่มือการติดตั้งแอป" onBack={onClose} />
        <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
            <Section title="ติดตั้งแอปบนหน้าจอหลัก">
                <p>
                    'Ai Studio แบบพกพา' เป็น Progressive Web App (PWA) ซึ่งหมายความว่าคุณสามารถ "ติดตั้ง" ลงบนหน้าจอหลักของอุปกรณ์ได้เหมือนแอปทั่วไป! เพื่อการเข้าถึงที่รวดเร็ว, ประสบการณ์เต็มหน้าจอ, และใช้งานบางฟีเจอร์แบบออฟไลน์ได้
                </p>
            </Section>

            <Section title="สำหรับ iPhone และ iPad (Safari)">
                <ol className="space-y-4">
                    <InstructionStep icon={<ShareIcon className="w-full h-full" />}>
                        เปิดแอปนี้ในเบราว์เซอร์ Safari แล้วแตะที่ปุ่ม <strong>"แชร์"</strong> (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น) ที่แถบด้านล่าง
                    </InstructionStep>
                    <InstructionStep>
                        เลื่อนลงมาในเมนูแชร์ แล้วมองหาและแตะที่ <strong>"เพิ่มไปยังหน้าจอโฮม"</strong> (Add to Home Screen)
                    </InstructionStep>
                    <InstructionStep>
                        ยืนยันชื่อแอปแล้วแตะ <strong>"เพิ่ม"</strong> (Add) ที่มุมขวาบน ไอคอนแอปจะปรากฏบนหน้าจอโฮมของคุณ!
                    </InstructionStep>
                </ol>
            </Section>

            <Section title="สำหรับ Android (Chrome)">
                 <ol className="space-y-4">
                    <InstructionStep icon={<ThreeDotsIcon className="w-full h-full" />}>
                        เปิดแอปนี้ในเบราว์เซอร์ Chrome แล้วแตะที่ปุ่มเมนู <strong>(จุดสามจุด)</strong> ที่มุมขวาบน
                    </InstructionStep>
                    <InstructionStep>
                        มองหาและแตะที่ <strong>"ติดตั้งแอป"</strong> (Install app) หรือ <strong>"เพิ่มไปยังหน้าจอหลัก"</strong> (Add to Home screen)
                    </InstructionStep>
                    <InstructionStep>
                        ทำตามคำแนะนำบนหน้าจอเพื่อยืนยันการติดตั้ง ไอคอนแอปจะถูกเพิ่มไปยังหน้าจอหลักหรือลิ้นชักแอปของคุณ
                    </InstructionStep>
                </ol>
            </Section>
            
            <Section title="สำหรับคอมพิวเตอร์ (Chrome, Edge)">
                 <ol className="space-y-4">
                    <InstructionStep icon={<InstallIcon className="w-full h-full" />}>
                        เปิดแอปนี้ในเบราว์เซอร์ Chrome หรือ Edge มองหา <strong>ไอคอนติดตั้ง</strong> (มักจะเป็นรูปจอคอมพิวเตอร์มีลูกศรชี้ลง) ที่ด้านขวาของแถบที่อยู่ (address bar)
                    </InstructionStep>
                    <InstructionStep>
                        คลิกที่ไอคอนนั้น แล้วกด <strong>"ติดตั้ง"</strong> (Install) ในหน้าต่างที่ปรากฏขึ้น
                    </InstructionStep>
                     <InstructionStep>
                        แอปจะถูกติดตั้งและสามารถเปิดใช้งานได้จากทางลัดบนเดสก์ท็อป, Start Menu, หรือ Launchpad
                    </InstructionStep>
                </ol>
            </Section>
            
            <Section title="การแก้ปัญหา & คำถามที่พบบ่อย">
                <h4 className="font-bold text-brand-yellow">ทำไมฉันไม่เห็นตัวเลือก "เพิ่มไปยังหน้าจอโฮม"?</h4>
                <p className="text-xs text-brand-light/80 mb-2">
                    บน iPhone/iPad คุณต้องใช้เบราว์เซอร์ <strong>Safari</strong> เท่านั้น เบราว์เซอร์อื่น เช่น Chrome หรือ Firefox บน iOS จะไม่มีตัวเลือกนี้ สำหรับ Android โปรดตรวจสอบให้แน่ใจว่าคุณใช้ Chrome เวอร์ชันล่าสุด
                </p>
                <h4 className="font-bold text-brand-yellow">นี่คือแอปจาก App Store หรือ Play Store หรือไม่?</h4>
                <p className="text-xs text-brand-light/80 mb-2">
                    ไม่ใช่ครับ นี่คือ Progressive Web App (PWA) ซึ่งเป็นเทคโนโลยีเว็บที่ให้ประสบการณ์เหมือนแอป โดยไม่ต้องดาวน์โหลดจากสโตร์ ทำให้มีขนาดเล็กและอัปเดตอัตโนมัติ
                </p>
                 <h4 className="font-bold text-brand-yellow">แอปใช้งานแบบออฟไลน์ได้หรือไม่?</h4>
                <p className="text-xs text-brand-light/80 mb-2">
                    ได้ครับ! เมื่อติดตั้งแล้ว คุณสามารถเปิดแอปและใช้ฟีเจอร์บางอย่าง เช่น ฟิลเตอร์วิดีโอ ได้โดยไม่ต้องเชื่อมต่ออินเทอร์เน็ต อย่างไรก็ตาม ฟีเจอร์ที่ต้องใช้ AI ทั้งหมด (เช่น การสร้างภาพ, เพลง, หรือแชท) จำเป็นต้องมีการเชื่อมต่ออินเทอร์เน็ตที่ใช้งานได้
                </p>
            </Section>
        </main>
    </PageWrapper>
);