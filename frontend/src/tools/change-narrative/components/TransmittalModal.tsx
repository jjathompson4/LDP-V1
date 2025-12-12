import React from 'react';
import { Copy } from 'lucide-react';

interface TransmittalModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    setText: (t: string) => void;
}

export const TransmittalModal: React.FC<TransmittalModalProps> = ({ isOpen, onClose, text, setText }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-app-surface w-full max-w-2xl h-[80vh] flex flex-col rounded-xl shadow-2xl border border-app-border">
                <div className="p-4 border-b border-app-border flex items-center justify-between">
                    <h3 className="font-bold text-lg">Transmittal Narrative</h3>
                    <button onClick={onClose} className="text-app-text-muted hover:text-app-text">
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                    <textarea
                        className="w-full h-full bg-app-bg border border-app-border rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-app-primary focus:outline-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <div className="p-4 border-t border-app-border flex justify-end gap-2">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(text);
                            alert("Copied to clipboard!");
                        }}
                        className="flex items-center gap-2 bg-app-primary text-white px-4 py-2 rounded-lg hover:bg-app-primary-hover font-medium"
                    >
                        <Copy className="w-4 h-4" /> Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    );
};
