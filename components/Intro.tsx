import React, { useState, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { LoadingSpinner } from './LoadingSpinner';

interface IntroProps {
  onSequenceComplete: () => void;
}

const introSequences = [
  { text: 'AI APPS 2.0', duration: 1500, showIcon: false, showBar: false },
  { text: '[SYSTEM BOOT SEQUENCE INITIATED]', sound: audioService.playBootSound1, duration: 2000, showIcon: false, showBar: false },
  { text: null, sound: audioService.playBootSound2, duration: 3000, showIcon: true, showBar: false },
  { text: 'Connecting to Gemini AI Core...', sound: audioService.playBootSound3, duration: 2500, showIcon: false, showBar: true },
  { text: '[CONNECTION ESTABLISHED]', sound: audioService.playBootSound4, duration: 1800, showIcon: false, showBar: false },
  { text: 'Welcome', duration: 1000, showIcon: false, showBar: false },
];

const LoadingBar: React.FC = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-64 h-4 bg-surface-1 border-2 border-border-primary mt-4">
            <div 
                className="h-full bg-brand-primary transition-all duration-[2000ms] ease-in-out"
                style={{ width: `${progress}%`}}
            ></div>
        </div>
    );
}

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-24 h-24 text-brand-primary animate-pulse-bright">
        <rect width="24" height="24" fill="var(--color-bg)"/>
        <path fill="currentColor" d="M8 4H16V5H17V6H18V8H19V16H18V18H17V19H16V20H8V19H7V18H6V16H5V8H6V6H7V5H8V4Z"/>
        <path fill="var(--color-bg)" d="M9 6H15V7H16V8H17V16H16V17H15V18H9V17H8V16H7V8H8V7H9V6Z"/>
        <path fill="var(--color-brand-magenta)" d="M11 11H13V13H11V11Z"/>
        <path fill="currentColor" d="M12 9H12V11H11V10H12V9Z"/>
        <path fill="currentColor" d="M13 10H12V11H13V10Z"/>
        <path fill="currentColor" d="M12 13H13V14H12V13Z"/>
        <path fill="currentColor" d="M11 13H12V14H11V14Z"/>
        <path fill="var(--color-brand-yellow)" d="M8 7H9V8H8V7Z"/>
        <path fill="var(--color-brand-yellow)" d="M15 7H16V8H15V7Z"/>
        <path fill="var(--color-brand-yellow)" d="M8 16H9V17H8V16Z"/>
        <path fill="var(--color-brand-yellow)" d="M15 16H16V17H15V16Z"/>
    </svg>
);


export const Intro: React.FC<IntroProps> = ({ onSequenceComplete }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);

    const animationTimeout = setTimeout(() => {
      if (introSequences[step].sound) {
        introSequences[step].sound();
      }
      setVisible(true);
    }, 300);

    const stepTimeout = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (step < introSequences.length - 1) {
          setStep(s => s + 1);
        } else {
          onSequenceComplete();
        }
      }, 500);
    }, introSequences[step].duration);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(stepTimeout);
    };
  }, [step, onSequenceComplete]);

  const currentStep = introSequences[step];

  return (
    <div className={`fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center font-press-start text-text-primary transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {currentStep.text && <p className="text-xl sm:text-3xl text-center text-brand-primary px-4">{currentStep.text}</p>}
        {currentStep.showIcon && <AppIcon />}
        {currentStep.showBar && <LoadingBar />}
    </div>
  );
};