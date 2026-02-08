import React from 'react';
import { Copy } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/ToastContext';
import { TOOL_TEXTAREA } from '../../../styles/toolStyleTokens';

interface TransmittalModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    setText: (t: string) => void;
}

export const TransmittalModal: React.FC<TransmittalModalProps> = ({ isOpen, onClose, text, setText }) => {
    const { showToast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard.', 'success');
        } catch {
            showToast('Could not copy to clipboard.', 'error');
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Transmittal Narrative"
            maxWidthClassName="max-w-3xl"
            footer={
                <Button onClick={handleCopy} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy to Clipboard
                </Button>
            }
        >
            <div className="h-[70vh] flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <textarea
                        className={`${TOOL_TEXTAREA} h-full font-mono resize-none`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
            </div>
        </Dialog>
    );
};
