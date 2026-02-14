import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ApiError } from '@/types/api';

interface UseApiReturn<T = any> {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    execute: (fn: () => Promise<T>) => Promise<T | null>;
    clearError: () => void;
    clearData: () => void;
}

export function useApi<T = any>(): UseApiReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);

    const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await apiCall();
            setData(result);
            return result;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearData = useCallback(() => {
        setData(null);
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        clearError,
        clearData,
    };
}

// Специализированные хуки для конкретных методов
export function useGet<T = any>() {
    const api = useApi<T>();
    
    const get = useCallback(async (url: string) => {
        return api.execute(() => apiClient.get<T>(url));
    }, [api]);
    
    return {
        ...api,
        get,
    };
}

export function usePost<T = any, D = any>() {
    const api = useApi<T>();
    
    const post = useCallback(async (url: string, data: D) => {
        return api.execute(() => apiClient.post<T>(url, data));
    }, [api]);
    
    return {
        ...api,
        post,
    };
}

export function usePut<T = any, D = any>() {
    const api = useApi<T>();
    
    const put = useCallback(async (url: string, data: D) => {
        return api.execute(() => apiClient.put<T>(url, data));
    }, [api]);
    
    return {
        ...api,
        put,
    };
}

export function useDelete<T = any>() {
    const api = useApi<T>();
    
    const del = useCallback(async (url: string) => {
        return api.execute(() => apiClient.delete<T>(url));
    }, [api]);
    
    return {
        ...api,
        delete: del,
    };
}