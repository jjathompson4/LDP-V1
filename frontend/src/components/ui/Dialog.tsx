import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidthClassName?: string;
}

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    title,
    onClose,
    children,
    footer,
    maxWidthClassName = 'max-w-lg'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`w-full ${maxWidthClassName} bg-app-surface border border-app-primary/30 rounded-2xl`}>
                <div className="flex items-center justify-between p-4 border-b border-app-border">
                    <h2 className="text-lg font-semibold text-app-text">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover" aria-label="Close dialog">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
                {footer ? <div className="p-4 border-t border-app-border flex justify-end gap-2">{footer}</div> : null}
            </div>
        </div>
    );
};
