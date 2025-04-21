import { writable } from "svelte/store";

export type Notification = {
    id: number;
    userId: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const notifications = writable<Notification[]>([]);

export async function loadNotifications(userId: number) {
    const res = await fetch(`http://localhost:3000/notification/${userId}`);
    const data = await res.json();
    
    notifications.set(data);
}