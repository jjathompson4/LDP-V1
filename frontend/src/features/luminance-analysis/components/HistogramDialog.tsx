import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    LogarithmicScale,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TOOL_CARD_TITLE, TOOL_ICON_BUTTON } from '../../../styles/toolStyleTokens';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

interface HistogramDialogProps {
    isOpen: boolean;
    onClose: () => void;
    bins: number[];
    counts: number[];
}

export const HistogramDialog: React.FC<HistogramDialogProps> = ({ isOpen, onClose, bins, counts }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const data = {
        labels: bins.map(b => b.toFixed(2)),
        datasets: [
            {
                label: 'Luminance Distribution',
                data: counts,
                borderColor: 'rgb(56, 189, 248)', // cyan-400 - keeping this as chart color for now, could be dynamic
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                display: true,
                title: { display: true, text: 'Luminance (cd/m²)', color: '#94a3b8' },
                ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            y: {
                display: true,
                title: { display: true, text: 'Frequency', color: '#94a3b8' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                borderColor: '#334155',
                borderWidth: 1,
            },
        },
    };

    return (
        <dialog
            ref={dialogRef}
            className="bg-app-surface text-app-text rounded-2xl border border-app-primary/30 p-0 backdrop:bg-black/50 w-[90vw] max-w-3xl"
            onClose={onClose}
        >
            <div className="flex items-center justify-between p-4 border-b border-app-border">
                <h2 className={TOOL_CARD_TITLE}>Luminance Histogram</h2>
                <button onClick={onClose} className={`p-1 ${TOOL_ICON_BUTTON}`}>
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 h-[400px]">
                <Line data={data} options={options} />
            </div>
        </dialog>
    );
};
