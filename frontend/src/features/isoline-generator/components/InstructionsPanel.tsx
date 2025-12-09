import React from 'react';

const InstructionsPanel: React.FC = () => {
    return (
        <div className="bg-app-surface p-4 rounded-lg shadow-sm border border-app-border">
            <h3 className="text-md font-semibold text-app-text mb-2">How to use with Bluebeam</h3>
            <ol className="list-decimal list-inside text-sm text-app-text-muted space-y-1">
                <li>Upload an IES file and configure settings.</li>
                <li>Set isoline values and colors.</li>
                <li>Click <strong>Preview Isolines</strong>.</li>
                <li>Export as PDF (recommended) or PNG.</li>
                <li>In Bluebeam, open your drawing and the exported file.</li>
                <li>Snapshot (Hotkey: G) the isolines and paste onto your drawing.</li>
                <li>Use the scale bar to calibrate and align.</li>
            </ol>

            <div className="mt-4 pt-3 border-t border-app-border">
                <h4 className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-1">Assumptions & Limitations</h4>
                <ul className="list-disc list-inside text-xs text-app-text-muted space-y-1">
                    <li>Single luminaire, direct-only calc.</li>
                    <li>Flat horizontal plane.</li>
                    <li>No interreflections or obstructions.</li>
                    <li>Type C IES, TILT=NONE only.</li>
                </ul>
            </div>
        </div>
    );
};

export default InstructionsPanel;
