/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AiConfigContextType {
    geminiApiKey: string | null;
    setGeminiApiKey: (key: string | null) => void;
}

const AiConfigContext = createContext<AiConfigContextType | undefined>(undefined);

export const AiConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage if available, or start null.
    const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(() => {
        try {
            return localStorage.getItem('geminiApiKey');
        } catch {
            return null;
        }
    });

    const setGeminiApiKey = (key: string | null) => {
        try {
            if (key) {
                localStorage.setItem('geminiApiKey', key);
            } else {
                localStorage.removeItem('geminiApiKey');
            }
        } catch (error) {
            console.error("Failed to save API key to localStorage", error);
        }
        setGeminiApiKeyState(key);
    };

    return (
        <AiConfigContext.Provider value={{ geminiApiKey, setGeminiApiKey }}>
            {children}
        </AiConfigContext.Provider>
    );
};

export const useAiConfig = (): AiConfigContextType => {
    const context = useContext(AiConfigContext);
    if (context === undefined) {
        throw new Error('useAiConfig must be used within an AiConfigProvider');
    }
    return context;
};
