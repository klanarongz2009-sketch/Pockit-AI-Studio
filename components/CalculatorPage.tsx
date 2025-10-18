

import React, { useState, useCallback } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import { useCredits } from '../contexts/CreditContext';

// A slightly safer evaluation function
const safeEval = (expression: string): number => {
    // 1. Validate the expression to allow only numbers, operators, dots, and parentheses.
    // This is a basic check and can be improved, but prevents obvious unwanted function calls.
    if (!/^[0-9+\-*/.() \t]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
    }
    // 2. Further checks to prevent things like `..` or `++` could be added here if needed.
    if (/\.{2,}/.test(expression) || /[+\-*/]{2,}/.test(expression.replace(/(\d)e\+/g, '$1~').replace(/(\d)e-/g, '$1~'))) { // Allow scientific notation
        throw new Error('Invalid syntax');
    }

    // 3. Use the Function constructor, which is generally safer than direct eval()
    // as it doesn't have access to the local scope.
    try {
        // We wrap it to ensure it returns a number
        const result = new Function(`return Number(${expression})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Calculation did not result in a valid number');
        }
        return result;
    } catch (e) {
        // This will catch syntax errors from the Function constructor
        // or runtime errors like division by zero (which results in Infinity).
        throw new Error('Invalid mathematical expression');
    }
};


export const CalculatorPage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();

    const handleButtonClick = useCallback((value: string) => {
        playSound(audioService.playClick);
        setError(null);
        if (result !== null) {
            // If starting a new calculation after a result,
            // either use the result or start fresh.
            if ('+-*/'.includes(value)) {
                setInput(result + value);
            } else {
                setInput(value);
            }
            setResult(null);
        } else {
            setInput(prev => prev + value);
        }
    }, [playSound, result]);

    const handleClear = useCallback(() => {
        playSound(audioService.playTrash);
        setInput('');
        setResult(null);
        setError(null);
    }, [playSound]);

    const handleBackspace = useCallback(() => {
        playSound(audioService.playToggle);
        setInput(prev => prev.slice(0, -1));
    }, [playSound]);

    const handleCalculate = useCallback(async () => {
        if (!input) return;
        playSound(audioService.playGenerate);
        try {
            const calculatedValue = safeEval(input);
            const resultString = String(calculatedValue);
            setResult(resultString);
            setInput(resultString); // Set input to result for chained calculations

            const creditsToAdd = Math.floor(Math.abs(calculatedValue));
            if (creditsToAdd > 0) {
                // FIX: addCredits is now async
                await addCredits(creditsToAdd);
                playSound(audioService.playCreditAdd);
            } else {
                playSound(audioService.playSuccess);
            }
        } catch (e) {
            playSound(audioService.playError);
            const errorMessage = e instanceof Error ? e.message : 'Calculation error';
            setError(errorMessage);
            setResult(null);
        }
    }, [input, playSound, addCredits]);
    
    const CalcButton: React.FC<{
        onClick: () => void;
        children: React.ReactNode;
        className?: string;
        label: string;
    }> = ({ onClick, children, className = '', label }) => (
        <button
            onClick={onClick}
            onMouseEnter={() => playSound(audioService.playHover)}
            aria-label={label}
            className={`flex items-center justify-center p-4 text-2xl border-4 border-brand-light shadow-pixel transition-all active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] ${className}`}
        >
            {children}
        </button>
    );

    const buttons = [
        { value: 'C', handler: handleClear, style: 'bg-brand-magenta text-white col-span-2', label: 'Clear' },
        { value: '⌫', handler: handleBackspace, style: 'bg-brand-cyan/80 text-black', label: 'Backspace' },
        { value: '/', handler: () => handleButtonClick('/'), style: 'bg-brand-cyan/80 text-black', label: 'Divide' },
        { value: '7', handler: () => handleButtonClick('7'), style: 'bg-brand-light text-black', label: '7' },
        { value: '8', handler: () => handleButtonClick('8'), style: 'bg-brand-light text-black', label: '8' },
        { value: '9', handler: () => handleButtonClick('9'), style: 'bg-brand-light text-black', label: '9' },
        { value: '*', handler: () => handleButtonClick('*'), style: 'bg-brand-cyan/80 text-black', label: 'Multiply' },
        { value: '4', handler: () => handleButtonClick('4'), style: 'bg-brand-light text-black', label: '4' },
        { value: '5', handler: () => handleButtonClick('5'), style: 'bg-brand-light text-black', label: '5' },
        { value: '6', handler: () => handleButtonClick('6'), style: 'bg-brand-light text-black', label: '6' },
        { value: '-', handler: () => handleButtonClick('-'), style: 'bg-brand-cyan/80 text-black', label: 'Subtract' },
        { value: '1', handler: () => handleButtonClick('1'), style: 'bg-brand-light text-black', label: '1' },
        { value: '2', handler: () => handleButtonClick('2'), style: 'bg-brand-light text-black', label: '2' },
        { value: '3', handler: () => handleButtonClick('3'), style: 'bg-brand-light text-black', label: '3' },
        { value: '+', handler: () => handleButtonClick('+'), style: 'bg-brand-cyan/80 text-black', label: 'Add' },
        { value: '0', handler: () => handleButtonClick('0'), style: 'bg-brand-light text-black col-span-2', label: '0' },
        { value: '.', handler: () => handleButtonClick('.'), style: 'bg-brand-light text-black', label: 'Decimal point' },
        { value: '=', handler: handleCalculate, style: 'bg-brand-yellow text-black', label: 'Equals' },
    ];


    return (
        <PageWrapper>
            <PageHeader title="เครื่องคิดเลขเครดิต" onBack={onClose} />
            <main className="w-full max-w-sm flex flex-col items-center gap-4 font-press-start">
                <div className="w-full p-4 bg-black/80 border-4 border-brand-light text-right h-28 flex flex-col justify-between shadow-pixel">
                    <div className="text-2xl text-brand-light/80 h-8 overflow-x-auto overflow-y-hidden whitespace-nowrap" dir="ltr">{input || '0'}</div>
                    <div className="text-4xl text-brand-yellow h-12 truncate" aria-live="polite">
                        {error ? <span className="text-lg text-brand-magenta">{error}</span> : result}
                    </div>
                </div>
                
                <div className="w-full grid grid-cols-4 gap-2">
                    {buttons.map(btn => (
                        <CalcButton key={btn.value} onClick={btn.handler} className={btn.style} label={btn.label}>
                            {btn.value}
                        </CalcButton>
                    ))}
                </div>
                
                <div className="font-sans text-sm text-center text-brand-light/80 p-2">
                   <p>รับ 1 เครดิตต่อ 1 หน่วยของผลลัพธ์ (ปัดลง)</p>
                   <p>ตัวอย่าง: ผลลัพธ์ 150 จะได้รับ 150 เครดิต</p>
                </div>
            </main>
        </PageWrapper>
    );
};
