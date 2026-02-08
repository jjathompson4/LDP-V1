import { GoogleGenAI, type Schema } from "@google/genai";

type GeminiTextPart = { text: string };
type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

interface CallGeminiParams {
    apiKey: string;
    model?: string;
    systemInstruction?: string;
    parts: GeminiPart[];
    responseSchema?: Schema;
    responseMimeType?: string;
    temperature?: number;
}

export const callGemini = async ({
    apiKey,
    model = 'gemini-3-flash-preview',
    systemInstruction,
    parts,
    responseSchema,
    responseMimeType,
    temperature
}: CallGeminiParams): Promise<string> => {
    try {
        console.log(`[Gemini API] Querying model: ${model}`);
        const ai = new GoogleGenAI({ apiKey });

        // Configure options
        const config: {
            responseMimeType?: string;
            responseSchema?: Schema;
            systemInstruction?: string;
            generationConfig?: { temperature: number };
        } = {};
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

    } catch (error: unknown) {
        console.error("Error in callGemini:", error);
        const message = error instanceof Error ? error.message : '';
        if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
            throw new Error("The Gemini API key is invalid.");
        }
        throw error;
    }
};
