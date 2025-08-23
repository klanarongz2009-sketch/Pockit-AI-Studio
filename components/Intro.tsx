
import React, { useState, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { SparklesIcon } from './icons/SparklesIcon';

interface IntroProps {
  onComplete: () => void;
}

const introSteps = [
  { text: 'ยินดีต้อนรับสู่', sound: audioService.playIntro1, duration: 2000 },
  { text: 'Ai Studio แบบพกพา', sound: audioService.playIntro2, duration: 2000 },
  { text: 'ขับเคลื่อนโดย Google AI', sound: audioService.playIntro3, icon: true, duration: 2500 },
];

export const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start invisible
    setVisible(false);

    // After a short delay, play sound and fade in
    const animationTimeout = setTimeout(() => {
      introSteps[step].sound();
      setVisible(true);
    }, 300);

    // After the specified duration, advance to the next step or complete
    const stepTimeout = setTimeout(() => {
      setVisible(false); // Start fade out
      setTimeout(() => { // Wait for fade out to finish
        if (step < introSteps.length - 1) {
          setStep(s => s + 1);
        } else {
          onComplete();
        }
      }, 500)
    }, introSteps[step].duration);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(stepTimeout);
    };
  }, [step, onComplete]);

  const currentStep = introSteps[step];

  return (
    <div className={`fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-press-start text-brand-light transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="text-xl sm:text-3xl text-center text-brand-cyan px-4">{currentStep.text}</p>
      {currentStep.icon && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-yellow">
              <SparklesIcon className="w-6 h-6"/>
              <span>Google AI</span>
          </div>
      )}
    </div>
  );
};
