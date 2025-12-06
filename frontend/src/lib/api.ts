import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for consistent error handling
client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // You can log errors here or transform them
        const message = (error.response?.data as any)?.detail || error.message || 'An unexpected error occurred';
        // We could attach the parsed message to the error object to make it easier for consumers
        // For now, we just reject the promise with the original error, but consumers can access response.data
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        client.get<T>(url, config).then(res => res.data),

    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        client.post<T>(url, data, config).then(res => res.data),

    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
        client.put<T>(url, data, config).then(res => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        client.delete<T>(url, config).then(res => res.data),

    // Helper for file uploads (multipart/form-data)
    upload: <T>(url: string, file: File | FormData, config?: AxiosRequestConfig) => {
        let data: FormData;
        if (file instanceof FormData) {
            data = file;
        } else {
            data = new FormData();
            data.append('file', file);
        }

        return client.post<T>(url, data, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    }
};

export type ApiError = AxiosError;
