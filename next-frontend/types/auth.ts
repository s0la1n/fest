export interface User {
    id: number;
    login: string;
    email: string;
    phone: string;
    name?: string;
    nickname?: string;
    last_name?: string;
    role: string;
    roles?: string[];
    ticket_type?: string;
    has_active_ticket?: boolean;
    balance?: number;
    is_admin?: boolean;
    is_cosplay_organizer?: boolean;
    is_tournament_organizer?: boolean;
    can_access_admin_panel?: boolean;
    ticket_number?: string;
    created_at?: string;
    updated_at?: string;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    message?: string;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
}

export interface CsrfResponse {
    message: string;
}