import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '@/types/api';

// Базовый URL API (обязательно с /api) и бэкенда (корень для sanctum/csrf-cookie)
const rawApi = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').trim().replace(/\/?$/, '');
const API_URL = rawApi.endsWith('/api') ? rawApi : rawApi + '/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (rawApi.endsWith('/api') ? rawApi.slice(0, -4) : rawApi) || 'http://localhost:8000';

/** Читает CSRF-токен из cookie (Laravel кладёт его в XSRF-TOKEN) */
function getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// Создаем экземпляр axios
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Флаг: CSRF-cookie уже запрашивали в этой сессии
let csrfCookieRequested = false;

// Перехватчик запросов: CSRF + Authorization
api.interceptors.request.use(
    async (config: AxiosRequestConfig): Promise<any> => {
        const isCsrfCookieUrl = config.url === '/sanctum/csrf-cookie' || (config.baseURL && config.url?.startsWith?.('/sanctum/csrf-cookie'));

        if (!isCsrfCookieUrl) {
            // Перед любым запросом к API получаем CSRF-cookie (один раз за сессию)
            if (!csrfCookieRequested) {
                try {
                    await axios.get(`${BACKEND_URL}/sanctum/csrf-cookie`, {
                        withCredentials: true,
                        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    });
                    csrfCookieRequested = true;
                } catch (e) {
                    console.warn('CSRF cookie request failed:', e);
                }
            }
            // Отправляем токен в заголовке (Laravel ожидает X-XSRF-TOKEN)
            const csrfToken = getCsrfTokenFromCookie();
            if (csrfToken) {
                config.headers = { ...config.headers, 'X-XSRF-TOKEN': csrfToken };
            }
        }

        // Токен авторизации (ключ 'token' как в AuthContext)
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

// Перехватчик ответов
api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    (error: AxiosError<ApiError>) => {
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

/** Заголовки авторизации для fetch (Record<string, string> для совместимости с HeadersInit) */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then((r) => r.data),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, data, config).then((r) => r.data),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, data, config).then((r) => r.data),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.patch<T>(url, data, config).then((r) => r.data),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config).then((r) => r.data),
};

export default api;