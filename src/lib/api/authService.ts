import { user, isAuthenticated } from '$lib/stores/user';

const API_URL = import.meta.env.VITE_BASE_URL;

export async function login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login Failed!');
    }

    user.set(data);
    isAuthenticated.set(true);
    
    return data;
}