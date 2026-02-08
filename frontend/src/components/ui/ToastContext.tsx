/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
        const toast: ToastItem = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            message,
            variant
        };
        setToasts(prev => [...prev, toast]);
        window.setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 3000);
    }, []);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed top-4 right-4 z-[95] flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`min-w-64 max-w-96 rounded-lg border px-3 py-2 shadow-lg flex items-start gap-2 ${
                            toast.variant === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-700'
                                : toast.variant === 'error'
                                ? 'bg-red-500/10 border-red-500/30 text-red-700'
                                : 'bg-app-surface border-app-border text-app-text'
                        }`}
                    >
                        {toast.variant === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
                        <div className="text-sm flex-1">{toast.message}</div>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="p-0.5 rounded hover:bg-black/10"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
