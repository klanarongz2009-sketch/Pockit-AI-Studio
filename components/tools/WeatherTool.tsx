import React, { useState, useCallback } from 'react';
import { PageHeader, PageWrapper } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { LoadingSpinner } from '../LoadingSpinner';
import * as weatherService from '../../services/weatherService';

interface WeatherToolProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const WeatherTool: React.FC<WeatherToolProps> = ({ onClose, playSound }) => {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState<weatherService.WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchWeather = useCallback(async () => {
        if (!city.trim()) return;
        setIsLoading(true);
        setError(null);
        setWeather(null);
        playSound(audioService.playGenerate);
        try {
            const data = await weatherService.getWeather(city);
            setWeather(data);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not fetch weather data.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [city, playSound]);

    return (
        <PageWrapper>
            <PageHeader title="Weather Forecast" onBack={onClose} />
            <main className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">
                    Enter a city name to get the current weather conditions.
                </p>
                <div className="w-full flex gap-2">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFetchWeather()}
                        placeholder="e.g., London, Tokyo..."
                        className="flex-grow p-3 bg-surface-1 border-2 border-border-primary rounded-md"
                        disabled={isLoading}
                    />
                    <button onClick={handleFetchWeather} disabled={!city.trim() || isLoading} className="p-3 bg-brand-primary text-text-inverted rounded-md disabled:bg-surface-2">
                        Get
                    </button>
                </div>

                <div className="w-full min-h-[12rem] p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="Fetching weather..." />}
                    {error && <p className="text-brand-accent">{error}</p>}
                    {weather && (
                        <div className="text-center">
                            <h2 className="text-2xl font-press-start text-brand-yellow">{weather.name}, {weather.country}</h2>
                            <div className="flex items-center justify-center my-2">
                                <span className="text-4xl font-bold">{weather.temp.toFixed(1)}°C</span>
                            </div>
                            <p className="capitalize text-lg">{weather.description}</p>
                            <p className="text-sm text-text-secondary">Feels like {weather.feels_like.toFixed(1)}°C</p>
                            <p className="text-sm text-text-secondary mt-2">Humidity: {weather.humidity}%</p>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
