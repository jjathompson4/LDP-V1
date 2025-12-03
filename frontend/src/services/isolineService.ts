import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface IsolineLevel {
    value: number;
    color: string;
}

export interface ComputeRequest {
    units: 'ft' | 'm';
    mountingHeight: number;
    calcPlaneHeight: number;
    radiusFactor: number;
    detailLevel: 'low' | 'medium' | 'high';
    llf: number;
    isoLevels: IsolineLevel[];
    illuminanceUnits: 'fc' | 'lux';
}

export interface IsolinePath {
    path: number[][]; // [[x, y], ...]
}

export interface IsolineLevelResult {
    value: number;
    color: string;
    paths: number[][][]; // List of paths
    labels: { x: number; y: number; text: string }[];
}

export interface ComputeResponse {
    units: 'ft' | 'm';
    illuminanceUnits: 'fc' | 'lux';
    mountingHeight: number;
    calcPlaneHeight: number;
    radius: number;
    extents: { minX: number; maxX: number; minY: number; maxY: number };
    scaleBar: { length: number; label: string };
    levels: IsolineLevelResult[];
}

export interface ExportOptions {
    pageSize: 'auto' | '24x36';
    includeLegend: boolean;
    includeLabels: boolean;
    scaleBarLength: number;
    units: 'ft' | 'm';
    illuminanceUnits: 'fc' | 'lux';
    includeDisclaimer: boolean;
}

export const isolineService = {
    compute: async (file: File, params: ComputeRequest): Promise<ComputeResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('params', JSON.stringify(params));

        const response = await axios.post(`${API_URL}/isoline/compute`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    exportPdf: async (isolineData: ComputeResponse, options: ExportOptions) => {
        const response = await axios.post(
            `${API_URL}/isoline/export-pdf`,
            { isolineData, options },
            {
                responseType: 'blob',
            }
        );
        return response.data;
    },

    exportPng: async (isolineData: ComputeResponse, options: ExportOptions) => {
        const response = await axios.post(
            `${API_URL}/isoline/export-png`,
            { isolineData, options },
            {
                responseType: 'blob',
            }
        );
        return response.data;
    },
};
