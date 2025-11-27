export interface AnalysisStats {
    min: number;
    max: number;
    avg: number;
}

export interface UploadResponse {
    sessionId: string;
    filename: string;
    width: number;
    height: number;
    stats: AnalysisStats;
    scaleFactor: number;
}

export interface RenderRequest {
    sessionId: string;
    exposure: number;
    gamma: number;
    useSrgb: boolean;
    falseColor: boolean;
    colormap: string;
    falsecolorMin: number;
    falsecolorMax: number;
}

export interface RenderResponse {
    image: string; // base64
    colorbar?: string; // base64
}

export interface HistogramResponse {
    bins: number[];
    counts: number[];
}

export interface AnalysisResult {
    original_image: string;
    false_color_image: string;
    stats: AnalysisStats;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadImage = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

export const renderImage = async (params: RenderRequest): Promise<RenderResponse> => {
    const response = await fetch(`${API_URL}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`);
    }

    return response.json();
};

export const getPixelLuminance = async (sessionId: string, x: number, y: number): Promise<number> => {
    const response = await fetch(`${API_URL}/pixel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, x, y }),
    });

    if (!response.ok) throw new Error('Failed to get pixel luminance');
    const data = await response.json();
    return data.luminance;
};

export const getRoiLuminance = async (sessionId: string, x0: number, y0: number, x1: number, y1: number): Promise<number> => {
    const response = await fetch(`${API_URL}/roi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, x0, y0, x1, y1 }),
    });

    if (!response.ok) throw new Error('Failed to get ROI luminance');
    const data = await response.json();
    return data.mean;
};

export const calibrateImage = async (sessionId: string, x: number, y: number, knownValue: number): Promise<{ scaleFactor: number, stats: AnalysisStats }> => {
    const response = await fetch(`${API_URL}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, x, y, knownValue }),
    });

    if (!response.ok) throw new Error('Calibration failed');
    return response.json();
};

export const getHistogram = async (sessionId: string): Promise<HistogramResponse> => {
    const response = await fetch(`${API_URL}/histogram?sessionId=${sessionId}`);
    if (!response.ok) throw new Error('Failed to get histogram');
    return response.json();
};
