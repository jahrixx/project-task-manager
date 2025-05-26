import { loadAdminNotifications, loadUserNotifications } from "$lib/stores/notification";
import { isAuthenticated, user, type User } from "$lib/stores/user";
import { derived, get, writable } from "svelte/store";


const API_URL = `${import.meta.env.VITE_BASE_URL}`;
let currentUser;
let errorMessage = "";

$: currentUser = get(user);
let role = currentUser?.role;
let userId = currentUser?.id;

export async function removeNotification(notificationId: number | null) {
    if(!notificationId) {
        console.error("Cannot delete Notification id: ID is undefined");
        return;
    } else if(!confirm("Are you sure you want to delete this Notification?")) {
        return;
    } 
        try {
            await deleteNotification(notificationId);
            alert("Notification Deleted Successfully");
        } catch (error) {
            console.error("Error deleting notification :", error);
            errorMessage = "Failed to delete notification. Please try again later!";
        }
}

//Delete Task
export async function deleteNotification(id: number) {
    const res = await fetch(`${API_URL}/notification/${id}`, { 
        method: "DELETE",
    });

    if(!res.ok){
        throw new Error("Failed to Delete Task!")
    }
    return res.json();
}

export async function markNotificationAsRead(id: number) {
    try { 
        const response = await fetch(`${API_URL}/notification/read/${id}`, { method: 'POST' });

        if(!response.ok) throw new Error('Failed to mark as unread.');
        if (role === "Admin") {
            await loadAdminNotifications();
        } else if (typeof userId === "number") {
            await loadUserNotifications(userId);
        } else {
            console.error("User ID is undefined. Cannot load user notifications.");
        }
    } catch (err) {
        console.error("Error marking notification as read: ", err);   
    }
}

export async function markNotificationAsUnread(id: number) {
    try { 
        const response = await fetch(`${API_URL}/notification/unread/${id}`, { method: 'POST' });

        if(!response.ok) throw new Error('Failed to mark as unread.');
        if (role === "Admin") {
            await loadAdminNotifications();
        } else if (typeof userId === "number") {
            await loadUserNotifications(userId);
        } else {
            console.error("User ID is undefined. Cannot load user notifications.");
        }
    } catch (err) {
        console.error("Error marking notification as read: ", err);   
    }
}