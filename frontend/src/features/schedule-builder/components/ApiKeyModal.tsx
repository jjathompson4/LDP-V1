import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
    onSave: (apiKey: string) => void;
    isVisible: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isVisible }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSave = () => {
        if (apiKey.trim()) {
            onSave(apiKey.trim());
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
        <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-app-surface border border-app-border rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-app-surface-hover mb-5">
                    <Key className="h-6 w-6 text-app-primary" />
                </div>
                <h2 className="text-2xl font-bold text-app-text mb-2">Enter Your Gemini API Key</h2>
                <p className="text-app-text-muted mb-6">
                    To use this application, please provide your own Google Gemini API key. Your key will be saved securely in your browser's local storage.
                </p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste your API key here"
                    className="w-full bg-app-bg border border-app-border rounded-md px-4 py-2.5 text-app-text focus:ring-2 focus:ring-app-primary focus:border-app-primary transition mb-6"
                />
                <button
                    onClick={handleSave}
                    disabled={!apiKey.trim()}
                    className="w-full bg-app-primary text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:bg-app-primary-hover disabled:bg-app-surface-hover disabled:text-app-text-muted disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-surface"
                >
                    Save & Continue
                </button>
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
