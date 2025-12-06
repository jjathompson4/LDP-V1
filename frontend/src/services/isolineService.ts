import { api } from '../lib/api';

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
    format: 'pdf' | 'png';
    includeScaleBar: boolean;
    includeLabels: boolean;
    includeDisclaimer: boolean;
    includeGrid: boolean;
    scaleBarLength: number;
    gridSpacing?: number | null;
}

const submitForm = (url: string, data: any) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank'; // Open in new tab to ensure download starts without navigating away

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'body';
    input.value = JSON.stringify(data);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const isolineService = {
    compute: async (file: File, params: ComputeRequest) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('params', JSON.stringify(params));

        // Using api.upload is not sufficient here because we have extra fields 'params'
        // But api.post accepts FormData if we construct it, or we can use our helper.
        // Our helper only takes 'file'. Let's use api.post directly with FormData.

        return api.post<ComputeResponse>('/isoline/compute', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    exportPdf: async (isolineData: ComputeResponse, options: ExportOptions) => {
        // Keep using submitForm for file download behavior which is often handled differently than AJAX
        // Or if the backend returns a blob, we could use api.post and save it.
        // The original implementation used a form submit to open in new tab/download. 
        // Let's preserve that behavior as requested ("DO NOT change the core UX flows").
        // We just need to make sure the URL is correct.
        submitForm(`${API_URL}/isoline/export-pdf`, { isolineData, options });
    },

    exportPng: async (isolineData: ComputeResponse, options: ExportOptions) => {
        submitForm(`${API_URL}/isoline/export-png`, { isolineData, options });
    },
};
