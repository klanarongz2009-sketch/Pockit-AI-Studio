const API_URL = "https://wttr.in";

export interface WeatherData {
    name: string;
    country: string;
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string; // This will be unused now but kept for interface compatibility
}

export async function getWeather(city: string): Promise<WeatherData> {
    const url = `${API_URL}/${encodeURIComponent(city)}?format=j1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // wttr.in might not return a JSON error body, so we use the status text
            throw new Error(`City not found or network error: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data.current_condition || data.current_condition.length === 0) {
            throw new Error("Weather data for this location is currently unavailable.");
        }

        const current = data.current_condition[0];
        const area = data.nearest_area[0];

        return {
            name: area.areaName[0].value,
            country: area.country[0].value,
            temp: parseFloat(current.temp_C),
            feels_like: parseFloat(current.FeelsLikeC),
            humidity: parseInt(current.humidity, 10),
            description: current.weatherDesc[0].value,
            icon: '', // wttr.in does not provide compatible icon codes
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Network error. Could not connect to weather service.");
            }
            throw error;
        }
        throw new Error("An unknown error occurred while fetching weather data.");
    }
}
