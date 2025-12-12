import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { useAiConfig } from './aiConfigContext';

interface GeminiKeyModalProps {
    isVisible: boolean;
    onClose?: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({ isVisible, onClose }) => {
    const { geminiApiKey, setGeminiApiKey } = useAiConfig();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isVisible && geminiApiKey) {
            setInputValue(geminiApiKey);
        } else if (isVisible) {
            setInputValue('');
        }
    }, [isVisible, geminiApiKey]);

    const handleSave = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            setGeminiApiKey(trimmed);
            if (onClose) onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-app-surface border border-app-border rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-app-surface-hover mb-5">
                    <Key className="h-6 w-6 text-app-primary" />
                </div>
                <h2 className="text-2xl font-bold text-app-text mb-2">Enter Gemini API Key</h2>
                <div className="mb-6">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-app-text-muted mb-2">
                        This key will be used for AI-powered features in all LDP tools for this session.
                    </label>
                    <input
                        type="password"
                        id="apiKey"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-lg text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
                        placeholder="AIzaSy..."
                        autoFocus
                    />
                    <p className="mt-3 text-xs text-app-text-muted">
                        The key is stored in memory for this session and is never sent to our servers (other than to Google's API).
                    </p>
                </div>
                <div className="flex gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-5 py-2.5 rounded-lg border border-app-border text-app-text hover:bg-app-surface-hover transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!inputValue.trim()}
                        className="flex-1 bg-app-primary text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:bg-app-primary-hover disabled:bg-app-surface-hover disabled:text-app-text-muted disabled:cursor-not-allowed transition-colors"
                    >
                        Save Key
                    </button>
                </div>
                <p className="text-xs text-app-text-muted mt-4">
                    Don't have a key? Get one from{' '}
                    <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-app-primary hover:underline">
                        Google AI Studio
                    </a>.
                </p>
            </div>
        </div>
    );
};
