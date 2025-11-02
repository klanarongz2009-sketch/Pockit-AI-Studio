const API_URL = "https://api.frankfurter.app";

export async function getCurrencies(): Promise<string[]> {
    const url = `${API_URL}/currencies`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        return Object.keys(data);
    } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch currencies: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching currencies.");
    }
}

export async function getConversion(from: string, to: string, amount: number): Promise<number> {
    if (from === to) {
        return amount;
    }
    const url = `${API_URL}/latest?amount=${amount}&from=${from}&to=${to}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.rates && data.rates[to]) {
            return data.rates[to];
        }
        throw new Error("Conversion rate not found in API response.");
    } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to get conversion rate: ${error.message}`);
        }
        throw new Error("An unknown error occurred during conversion.");
    }
}
