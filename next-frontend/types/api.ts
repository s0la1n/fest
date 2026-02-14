// Типы для пользователя
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

// Типы для ответов API
export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    success: boolean;
    errors?: Record<string, string[]>;
}

// Типы для аутентификации
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Тип для ошибок API
export interface ApiError {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
}

// Типы для Laravel API
export interface LaravelPaginatedResponse<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}