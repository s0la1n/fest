'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { User, ApiError } from '@/types/auth';

type AuthContextType = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (login: string, password: string) => Promise<void>;
    authLogin: (token: string, userData: any) => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
    isAdmin: () => boolean;
    isCosplayOrganizer: () => boolean;
    isTournamentOrganizer: () => boolean;
    updateUser: (userData: Partial<User>) => void;
    refreshUserData: () => Promise<void>;
    testApiConnection: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Инициализация при загрузке
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const userWithRoles: User = {
                        ...parsedUser,
                        roles: parsedUser.roles || [parsedUser.role] || ['user']
                    };
                    
                    setToken(storedToken);
                    setUser(userWithRoles);
                    
                    // Проверяем токен на валидность
                    try {
                        await apiService.getUser(storedToken);
                    } catch (error) {
                        // Если токен невалидный - чистим
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken(null);
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Ошибка инициализации аутентификации:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Метод для прямого логина (после регистрации)
    const authLogin = (newToken: string, userData: any) => {
        const userWithRoles: User = {
            ...userData,
            roles: userData.roles || [userData.role] || ['user']
        };
        
        setToken(newToken);
        setUser(userWithRoles);

        if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userWithRoles));
        }
    };

    // Метод для логина через API
    const login = async (loginStr: string, password: string) => {
        setLoading(true);
        try {
            const response = await apiService.login({
                login: String(loginStr ?? ''),
                password: String(password ?? ''),
            });
            
            if (response.token && response.user) {
                authLogin(response.token, response.user);
                router.push('/');
            } else {
                throw new Error(response.message || 'Ошибка авторизации');
            }
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.errors) {
                const msg = typeof apiError.message === 'string'
                    ? apiError.message
                    : Array.isArray(apiError.message)
                        ? apiError.message[0]
                        : String(apiError.message ?? 'Ошибка авторизации');
                const errorWithFields: any = new Error(msg);
                errorWithFields.fields = apiError.errors;
                throw errorWithFields;
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Метод для выхода
    const logout = async () => {
        try {
            if (token) {
                await apiService.logout(token);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setToken(null);
            setUser(null);
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            
            router.push('/signin');
        }
    };

    const hasRole = (role: string): boolean => {
        if (!user) return false;
        const roles = (user.roles && Array.isArray(user.roles) ? user.roles : [user.role]) as string[];
        return roles.includes(role);
    };
    const isAdmin = () => hasRole('admin') || user?.is_admin === true;
    const isCosplayOrganizer = () => hasRole('cosplay_organizer') || user?.is_cosplay_organizer === true;
    const isTournamentOrganizer = () => hasRole('tournament_organizer') || user?.is_tournament_organizer === true;

    // Обновление данных пользователя
    const updateUser = (userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updatedUser: User = { ...prev, ...userData };
            
            if (userData.role && !updatedUser.roles?.includes(userData.role)) {
                updatedUser.roles = [userData.role];
            }
            
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            return updatedUser;
        });
    };

    // Обновление данных пользователя с сервера
    const refreshUserData = async () => {
        if (!token) return;

        try {
            const userData = await apiService.getUser(token);
            updateUser({
                ...userData,
                roles: userData.roles || [userData.role] || ['user']
            });
        } catch (error) {
            if ((error as Error).message === 'Не авторизован') {
                logout();
            }
            console.error('Ошибка обновления данных пользователя:', error);
        }
    };

    // Тест соединения с API
    const testApiConnection = async (): Promise<boolean> => {
        try {
            await apiService.testConnection();
            return true;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    };

    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        authLogin,
        logout,
        hasRole,
        isAdmin,
        isCosplayOrganizer,
        isTournamentOrganizer,
        updateUser,
        refreshUserData,
        testApiConnection,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};