import { LoginRequest, AuthResponse, ApiError, User } from '@/types/auth';

// Единый origin через Next.js rewrites (/api, /sanctum) — cookies и CSRF работают на :3000
const API_BASE = '/api';
const SANCTUM_CSRF_URL = '/sanctum/csrf-cookie';

class ApiService {
    private async getCsrfToken(): Promise<string | null> {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    private getHeaders(csrfToken?: string | null): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const text = await response.text();
        if (!text) {
            throw new Error('Пустой ответ от сервера');
        }
        let data: any;
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: 'Некорректный ответ сервера' };
        }

        if (!response.ok) {
            const error: ApiError = {
                message: data.message || 'Произошла ошибка',
                errors: data.errors,
                status: response.status,
            };
            throw error;
        }

        return data;
    }

    async setCsrfCookie(): Promise<void> {
        await fetch(SANCTUM_CSRF_URL, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        await this.setCsrfCookie();
        const csrfToken = await this.getCsrfToken();

        const payload = {
            login: String(data.login ?? ''),
            password: String(data.password ?? ''),
        };

        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: this.getHeaders(csrfToken),
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        return this.handleResponse<AuthResponse>(response);
    }

    async logout(token: string): Promise<void> {
        try {
            await this.setCsrfCookie();
            const csrfToken = await this.getCsrfToken();
            const headers = { ...this.getHeaders(csrfToken), 'Authorization': `Bearer ${token}` };
            await fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers,
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async getUser(token: string): Promise<User> {
        const response = await fetch(`${API_BASE}/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            throw new Error('Не авторизован');
        }

        const data = await this.handleResponse<{ user: User }>(response);
        return data.user;
    }

    async testConnection(): Promise<any> {
        const response = await fetch(`${API_BASE}/test-cors`, {
            method: 'GET',
            credentials: 'include',
        });
        return this.handleResponse(response);
    }
}

export const apiService = new ApiService();