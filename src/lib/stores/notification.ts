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

export async function loadNotifications(userId: number, role: string) {
    try {
        let endpoint = " ";
        if(role === "Admin"){
            endpoint = `http://localhost:3000/notification/admin/all`;
        } else {
            endpoint = `http://localhost:3000/notification/${userId}`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        
        const notificationsData = data.notifications || [];
        
        notifications.set(notificationsData);
        return notificationsData;
    } catch (error) {
        console.error("Error loading notification: ", error);
        notifications.set([]);   
        throw error;
    }
}