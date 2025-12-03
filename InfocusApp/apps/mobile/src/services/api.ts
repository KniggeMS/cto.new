import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function getHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export const api = {
    get: async (endpoint: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
        return res.json();
    },

    patch: async (endpoint: string, body: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`PATCH ${endpoint} failed: ${res.status}`);
        return res.json();
    },

    delete: async (endpoint: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
        return res.json(); // Some delete endpoints might not return JSON, handle accordingly if needed
    }
};
