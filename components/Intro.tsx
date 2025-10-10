import React, { useState, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { SparklesIcon } from './icons/SparklesIcon';

interface IntroProps {
  onSequenceComplete: () => void;
}

const introSequences = [
  { text: 'AIOS Initializing...', sound: audioService.playBootSound1, duration: 2000, showIcon: false, showBar: false },
  { text: 'Loading Core Modules...', sound: audioService.playBootSound2, duration: 3000, showIcon: false, showBar: true },
  { text: 'Connecting to Gemini Core...', sound: audioService.playBootSound3, duration: 2500, showIcon: true, showBar: false },
  { text: 'System Ready', sound: audioService.playBootSound4, duration: 1800, showIcon: false, showBar: false },
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
                className="h-full bg-brand-primary transition-all duration-[2500ms] ease-in-out"
                style={{ width: `${progress}%`}}
            ></div>
        </div>
    );
}


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
      <p className="text-xl sm:text-3xl text-center text-brand-primary px-4">{currentStep.text}</p>
      {currentStep.showIcon && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-secondary">
              <SparklesIcon className="w-6 h-6"/>
              <span>Google AI</span>
          </div>
      )}
      {currentStep.showBar && <LoadingBar />}
    </div>
  );
};
