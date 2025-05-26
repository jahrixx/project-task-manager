import { get } from "svelte/store";
import { user } from "$lib/stores/user";

const API_URL = `${import.meta.env.VITE_BASE_URL}`;

export async function fetchUserProfile(userId: string) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user data");
    return await response.json();
}

export async function uploadImage(file: File, userId: string) {
    const formData = new FormData();
    formData.append('profilePic', file);

    const response = await fetch(`${API_URL}/users/upload/${userId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload profile picture');

    const data = await response.json();
    const newProfilePicUrl = `${API_URL}${data.profilePicUrl}?t=${Date.now()}`;
    
    user.update((u) => {
        if (u) {
            const updatedUser = { ...u, profilePic: newProfilePicUrl };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
        }
        return u;
    });
    
    return newProfilePicUrl;
}

export async function updatePassword(oldPassword: string, newPassword: string, userId: string) {
    const response = await fetch(`${API_URL}/users/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, oldPassword, newPassword }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message);
    }

    return data;
}