import { type User } from "$lib/stores/user";

const API_URL = `${import.meta.env.VITE_BASE_URL}users`;

export async function getUsers() {
    const res = await fetch(API_URL);
    return res.json();
}

export async function createUser(data: User) {
    try {
        console.log("Sending user data:", data);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create user.");
        }

        console.log("User created successfully:", result);
        return result;
    } catch (error) {
        console.error("Error creating user:", error);
        alert(`Error: ${error}`);
    }
}

export async function updateUser(id: number, data: User) {
    console.log("Updating user with ID:", id);
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update user.");
        }

        return await response.json(); // Return updated user data
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}

export async function deleteUser(id: number) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}

export async function getRoles() {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/roles`);
    return res.json();
}

export async function getOffices() {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/offices`);
    return res.json();
}