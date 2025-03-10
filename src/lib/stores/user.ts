import { writable, derived } from "svelte/store";

export interface User {
    id?: number;
    username?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    office?: string;
    number?: string;
    address?: string;
    birthday?: string;
    profilePic?: string;
}

const storedUser = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
const parsedUser = storedUser ? JSON.parse(storedUser) : null;

export const user = writable<User | null>(parsedUser);
export const isAuthenticated = writable<boolean>(!!parsedUser);
export const userRole = derived(user, ($user: User | null) => $user?.role || "");

// Ensure the store updates localStorage when changed
user.subscribe((value) => {
    if (typeof window !== 'undefined') {
        if (value) {
            localStorage.setItem("user", JSON.stringify(value));
        } else {
            localStorage.removeItem("user");
        }
    }
});