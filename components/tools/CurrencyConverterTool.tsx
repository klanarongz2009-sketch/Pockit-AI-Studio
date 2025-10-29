import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, PageWrapper } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { LoadingSpinner } from '../LoadingSpinner';
import * as exchangeRateService from '../../services/exchangeRateService';

interface CurrencyConverterToolProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const CurrencyConverterTool: React.FC<CurrencyConverterToolProps> = ({ onClose, playSound }) => {
    const [amount, setAmount] = useState('1');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const currencyList = await exchangeRateService.getCurrencies();
                setCurrencies(currencyList);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load currency list.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCurrencies();
    }, []);

    const handleConvert = useCallback(async () => {
        if (isLoading || !amount) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        playSound(audioService.playGenerate);
        try {
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount)) throw new Error("Invalid amount");
            const conversionResult = await exchangeRateService.getConversion(fromCurrency, toCurrency, numericAmount);
            setResult(`${numericAmount.toLocaleString()} ${fromCurrency} = ${conversionResult.toLocaleString()} ${toCurrency}`);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Conversion failed.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, amount, fromCurrency, toCurrency, playSound]);
    
    const handleSwap = () => {
        playSound(audioService.playToggle);
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    if (isLoading && currencies.length === 0) {
        return <PageWrapper><PageHeader title="Currency Converter" onBack={onClose} /><LoadingSpinner text="Loading currencies..." /></PageWrapper>;
    }

    return (
        <PageWrapper>
            <PageHeader title="Currency Converter" onBack={onClose} />
            <main className="w-full max-w-lg flex flex-col items-center gap-4 font-sans">
                <p className="text-sm text-center text-text-secondary">Convert currencies using live exchange rates.</p>
                {error && <p className="text-brand-accent">{error}</p>}
                <div className="w-full p-4 bg-surface-1 border-4 border-border-primary space-y-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                        <div>
                            <label className="text-xs font-press-start">From</label>
                            <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="w-full p-2 bg-surface-2 rounded-md mt-1">
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={handleSwap} className="p-2 border-2 border-border-primary rounded-full">↔</button>
                        <div>
                            <label className="text-xs font-press-start">To</label>
                            <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="w-full p-2 bg-surface-2 rounded-md mt-1">
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-press-start">Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-surface-2 rounded-md mt-1" />
                    </div>
                    <button onClick={handleConvert} disabled={isLoading} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">
                        {isLoading ? 'Converting...' : 'Convert'}
                    </button>
                </div>
                 {result && !isLoading && (
                    <div className="w-full p-4 bg-brand-lime/20 border-2 border-brand-lime text-center font-press-start text-lg">
                        {result}
                    </div>
                 )}
            </main>
        </PageWrapper>
    );
};