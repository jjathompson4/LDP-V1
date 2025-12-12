import { GoogleGenAI, type Schema } from "@google/genai";

interface CallGeminiParams {
    apiKey: string;
    model?: string;
    systemInstruction?: string;
    parts: any[]; // Using any[] for flexibility with the SDK's content types
    responseSchema?: Schema;
    responseMimeType?: string;
    temperature?: number;
}

export const callGemini = async ({
    apiKey,
    model = 'gemini-2.0-flash',
    systemInstruction,
    parts,
    responseSchema,
    responseMimeType,
    temperature
}: CallGeminiParams): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey });

        // Configure options
        const config: any = {};
        if (responseMimeType) config.responseMimeType = responseMimeType;
        if (responseSchema) config.responseSchema = responseSchema;
        if (systemInstruction) config.systemInstruction = systemInstruction;

        // Add generation config (temperature, maxOutputTokens, etc)
        config.generationConfig = {
            temperature: temperature ?? 1.0, // Default to 1.0 if not provided
        };

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config
        });

        const text = response.text;
        if (!text) {
            throw new Error("No text returned from Gemini.");
        }
        return text;

    } catch (error: any) {
        console.error("Error in callGemini:", error);
        if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
            throw new Error("The Gemini API key is invalid.");
        }
        throw error;
    }
};
