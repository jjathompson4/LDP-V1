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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-700 mb-5">
                    <Key className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Enter Your Gemini API Key</h2>
                <p className="text-slate-400 mb-6">
                    To use this application, please provide your own Google Gemini API key. Your key will be saved securely in your browser's local storage.
                </p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste your API key here"
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition mb-6"
                />
                <button
                    onClick={handleSave}
                    disabled={!apiKey.trim()}
                    className="w-full bg-cyan-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                    Save & Continue
                </button>
                <p className="text-xs text-slate-500 mt-4">
                    Don't have a key? Get one from{' '}
                    <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
                        Google AI Studio
                    </a>.
                </p>
            </div>
        </div>
    );
};
