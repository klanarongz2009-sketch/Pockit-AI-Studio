const API_URL = "https://v6.exchangerate-api.com/v6";
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

export async function getCurrencies(): Promise<string[]> {
    if (!API_KEY) {
        throw new Error("Exchange Rate API key not found. Please set the EXCHANGE_RATE_API_KEY environment variable.");
    }
    const url = `${API_URL}/${API_KEY}/codes`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.result === 'error') {
            throw new Error(`API error: ${data['error-type']}`);
        }
        return data.supported_codes.map((code: [string, string]) => code[0]);
    } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch currencies: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching currencies.");
    }
}

export async function getConversion(from: string, to: string, amount: number): Promise<number> {
    if (!API_KEY) {
        throw new Error("Exchange Rate API key not found.");
    }
    const url = `${API_URL}/${API_KEY}/pair/${from}/${to}/${amount}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.result === 'error') {
            throw new Error(`API error: ${data['error-type']}`);
        }
        return data.conversion_result;
    } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to get conversion rate: ${error.message}`);
        }
        throw new Error("An unknown error occurred during conversion.");
    }
}
