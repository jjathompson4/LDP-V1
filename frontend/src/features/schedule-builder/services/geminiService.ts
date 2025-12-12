import { Type } from "@google/genai";
import { convertPdfToImageBase64 } from '../utils/fileProcessor';
import type { Fixture, ColumnConfig } from '../types';
import { callGemini } from "../../../shared/ai/geminiClient";

const generateFixtureSchema = (columns: ColumnConfig[]) => {
    const properties: { [key: string]: any } = {};
    const required: string[] = ['manufacturer', 'series', 'designation', 'description'];

    columns.forEach(col => {
        // For default fields that have associated 'Options' arrays
        const hasOptions = [
            'voltage', 'wattage', 'wattPerFoot', 'deliveredLumens',
            'cct', 'cri', 'mounting', 'finish'
        ].includes(String(col.key));

        properties[col.key] = {
            type: Type.STRING,
            description: col.description,
        };

        if (hasOptions) {
            properties[`${col.key}Options`] = {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `An array of all available options for ${col.label}.`
            };
        }
    });

    return {
        type: Type.OBJECT,
        properties,
        required: required.filter(key => columns.some(c => c.key === key)),
    };
};

export const extractFixtureDataFromPdf = async (file: File, columns: ColumnConfig[], apiKey: string): Promise<Partial<Fixture> | null> => {
    try {
        if (!apiKey) {
            throw new Error("Your Gemini API key is not set. Please provide it to continue.");
        }

        const base64Image = await convertPdfToImageBase64(file);
        if (!base64Image) {
            throw new Error("Failed to convert PDF to image.");
        }

        const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: base64Image,
            },
        };

        const textPart = {
            text: "Analyze this product data sheet for a lighting fixture. Extract the specified fields into a JSON object matching the provided schema. Prioritize information from tables and specification sections. Pay special attention to any user-added annotations like highlights or drawn boxes, as the information within or near these markings is highly important. IMPORTANT: Ignore any 'sample ordering numbers', 'example ordering codes', or any other text explicitly labeled as an 'example', as this is illustrative and not actual product data. For any field where the information is not available or cannot be found, you MUST use '--' as the value. Do not use phrases like 'Not specified' or 'N/A'."
        };

        const fixtureSchema = generateFixtureSchema(columns);

        const jsonString = await callGemini({
            apiKey,
            parts: [textPart, imagePart],
            responseSchema: fixtureSchema,
            responseMimeType: "application/json"
        });

        if (jsonString) {
            const parsedJson = JSON.parse(jsonString);
            return parsedJson as Partial<Fixture>;
        }
        return null;

    } catch (error) {
        console.error("Error in geminiService:", error);
        throw error;
    }
};
