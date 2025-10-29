const API_URL = "https://api.openweathermap.org/data/2.5/weather";
const API_KEY = process.env.WEATHER_API_KEY;

export interface WeatherData {
    name: string;
    country: string;
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
}

export async function getWeather(city: string): Promise<WeatherData> {
    if (!API_KEY) {
        throw new Error("Weather API key not found. Please set the WEATHER_API_KEY environment variable.");
    }

    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return {
            name: data.name,
            country: data.sys.country,
            temp: data.main.temp,
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
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
