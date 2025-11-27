export const getApiKey = (): string | null => {
    try {
        return localStorage.getItem('gemini-api-key');
    } catch (error) {
        console.error("Could not access localStorage:", error);
        return null;
    }
};

export const setApiKey = (apiKey: string): void => {
    try {
        localStorage.setItem('gemini-api-key', apiKey);
    } catch (error) {
        console.error("Could not write to localStorage:", error);
    }
};
