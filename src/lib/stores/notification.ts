import { writable } from "svelte/store";

export type Notification = {
    id: number;
    userId: number;
    message: string;
    taskId: number | null;
    type: string | null;
    isRead: boolean;
    createdAt: string;
    taskTitle?: string;
    firstName?: string;
    lastName?: string;
    creatorRole?: string;
    profilePic?: string | null;
}

export const notifications = writable<Notification[]>([]);

// export async function loadNotifications(userId: number) {
//     try {
//         const res = await fetch(`http://localhost:3000/notification/${userId}`);
//         const data = await res.json();
//         const notificationsData = data.notifications || data;
        
//         notifications.set(notificationsData);
//         return notificationsData;
//     } catch (error) {
//         console.error("Error loading notification: ", error);
//         notifications.set([]);   
//         throw error;
//     }
// }

export async function loadAdminNotifications() {
    try {
        const res = await fetch(`http://localhost:3000/notification/admin/all`);
        const data = await res.json();
        const notificationsData = data.notifications || [];
        notifications.set(notificationsData);
        return notificationsData;
    } catch (error) {
        console.error("Error loading admin notifications: ", error);
        notifications.set([]);
        throw error;
    }
}

export async function loadUserNotifications(userId: number) {
    try {
        const res = await fetch(`http://localhost:3000/notification/${userId}`);
        const data = await res.json();
        const notificationsData = data.notifications || [];
        notifications.set(notificationsData);
        return notificationsData;
    } catch (error) {
        console.error("Error loading user notifications: ", error);
        notifications.set([]);
        throw error;
    }
}
