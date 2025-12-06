import { api } from '../../../lib/api';

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
    theme?: string;
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

export const uploadImage = async (file: File): Promise<UploadResponse> => {
    return api.upload<UploadResponse>('/upload', file);
};

export const renderImage = async (params: RenderRequest): Promise<RenderResponse> => {
    return api.post<RenderResponse>('/render', params);
};

export const getPixelLuminance = async (sessionId: string, x: number, y: number): Promise<number> => {
    const data = await api.post<{ luminance: number }>('/pixel', { sessionId, x, y });
    return data.luminance;
};

export const getRoiLuminance = async (sessionId: string, x0: number, y0: number, x1: number, y1: number): Promise<number> => {
    const data = await api.post<{ mean: number }>('/roi', { sessionId, x0, y0, x1, y1 });
    return data.mean;
};

export const calibrateImage = async (sessionId: string, x: number, y: number, knownValue: number): Promise<{ scaleFactor: number, stats: AnalysisStats }> => {
    return api.post<{ scaleFactor: number, stats: AnalysisStats }>('/calibrate', { sessionId, x, y, knownValue });
};

export const getHistogram = async (sessionId: string): Promise<HistogramResponse> => {
    return api.get<HistogramResponse>(`/histogram?sessionId=${sessionId}`);
};
