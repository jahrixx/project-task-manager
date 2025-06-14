import type { TaskData } from "$lib/stores/task";
import { refreshTasks } from "./taskService";
import { user } from "$lib/stores/user";
import { writable , get} from "svelte/store";
import { showToast } from "./toastService";

export let archivedTasks = writable<TaskData[]>([]);

export async function fetchArchivedTasks(): Promise<TaskData[]> {
    try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/tasks/archived`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch archived tasks');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function archiveTask(taskId: number): Promise<void> {
    try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/tasks/${taskId}/archive`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to archive task!');
        showToast({ type: "success", message: "Task archived successfully!" });
        await refreshTasks();
    } catch (error) {
        console.error('Error archiving task:', error);
        showToast({ type: "error", message: "Failed to archive task!" });
    }
}

export async function unarchiveTask(taskId: number): Promise<void> {
    try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/tasks/${taskId}/unarchive`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to unarchive task!');
        showToast({ type: "success", message: "Task unarchived successfully!" });
        await refreshTasks();
    } catch (error) {
        console.error('Error unarchiving task:', error);
        showToast({ type: "error", message: "Failed to unarchive task!" });
    }
}

export async function loadArchiveTasks() {
    try {
        const fetchedTasks = await fetchArchivedTasks();
        const currentUser = get(user);

        let filteredArchived = Array.isArray(fetchedTasks) ? fetchedTasks : [];

        filteredArchived = filteredArchived.filter((task: TaskData) => {
        if(currentUser?.role === 'Employee'){
                return task.assignedTo === currentUser?.id || task.createdBy === currentUser?.id; 
            } else if (currentUser?.role === 'Manager') {
                return task.assignedTo === currentUser?.id ||
                        task.createdBy === currentUser?.id ||
                        task.office === currentUser?.office;
            }
            return true;
        });

        archivedTasks.set(filteredArchived);
        return filteredArchived;
    } catch (error) {
        console.error('Error loading archived tasks!', error);
        archivedTasks.set([]);
        return [];
    }
}
