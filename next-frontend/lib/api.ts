import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '@/types/api';

const API_BASE = '/api';
const BACKEND_URL = '';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

const csrfApi: AxiosInstance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

let csrfCookieReady = false;

async function ensureCsrfCookie(force = false): Promise<void> {
    if (csrfCookieReady && !force) return;
    await csrfApi.get('/sanctum/csrf-cookie');
    csrfCookieReady = true;
}

api.interceptors.request.use(
    async (config: AxiosRequestConfig): Promise<any> => {
        const method = (config.method ?? 'get').toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            try {
                await ensureCsrfCookie();
            } catch (e) {
                console.warn('CSRF cookie request failed:', e);
            }
        }

        if (typeof document !== 'undefined') {
            const csrfToken = getCsrfTokenFromCookie();
            if (csrfToken) {
                config.headers = { ...config.headers, 'X-XSRF-TOKEN': csrfToken };
            }
        }

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers = { ...config.headers, 'Authorization': `Bearer ${token}` };
            }
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

function getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 419) {
            csrfCookieReady = false;
            try {
                await ensureCsrfCookie(true);
            } catch {
                // ignore
            }
        }
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
        const data = (error.response?.data ?? {}) as Record<string, unknown>;
        const message =
            (data.message as string) ||
            (data.error as string) ||
            error.message ||
            `Ошибка запроса${error.response?.status ? ` (${error.response.status})` : ''}`;
        const err = new Error(message) as Error & ApiError;
        err.status = error.response?.status;
        err.errors = (data.errors as Record<string, string[]>) ?? undefined;
        return Promise.reject(err);
    }
);

export const apiClient = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then((r) => r.data),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, data, config).then((r) => r.data),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, data, config).then((r) => r.data),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.patch<T>(url, data, config).then((r) => r.data),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config).then((r) => r.data),
};

export default api;