import { writable } from "svelte/store";
import type { TaskData, TaskResponse } from "$lib/stores/task";
import { user } from "$lib/stores/user";
import { get } from "svelte/store";
import { showToast } from "./toastService";

const API_URL = `${import.meta.env.VITE_BASE_URL}`;
export const tasks = writable<TaskData[]>([]);
export let allTasks: Record<string, TaskData[]> = {}; 
export let errorMessage= '';
export async function createTask(taskData: TaskData): Promise<TaskResponse> {    
    const startDate = new Date(taskData.startDate);
    const endDate = new Date(taskData.endDate);
    if(endDate.getTime() < startDate.getTime()){
        showToast({ type: "error", message: "End Date Cannot Be Earlier Than The Start Date!" });
        return Promise.reject("End Date Validation Failed!");

    } else if(endDate.getTime() === startDate.getTime()){
        showToast({ type: "error", message: "Start Date Cannot Be Equal To End Date!" });
        return Promise.reject("End Date Validation Failed!");
    }
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create task.");
            }
            return await response.json();
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
}

export async function fetchEmployees(office: string | number): Promise<{ id: number; name: string; role: string; office: string }[]> {
    try {
        const response = await fetch(`${API_URL}/tasks/employees/${office}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch employees.");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching employees:", error);
        throw error;
    }
}

export async function fetchTasks(userId: number | null, role: string | null, office: string | null) {
    try {
        const userIdParam = userId ?? 0;
        const roleParam = role ?? "";
        const officeParam = office ?? "";
        const response = await fetch(`${API_URL}/tasks?userId=${userIdParam}&role=${roleParam}&office=${officeParam}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch tasks.");
            }
        
        const data = await response.json();
            if(role !== "Admin"){
                data.forEach((task: TaskData) => {
                    const now = new Date();
                    const endDate = new Date(task.endDate);
                });
            }
            return role === "Admin"
                ? transformGroupedTasks(data)
                : [{ officeName: "My Tasks", tasks: data }];
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
    }
}

export async function refreshTasks() {
    const currentUser = get(user);
    if(!currentUser){
        return;
    }
    const fetchedTasks = await fetchTasks(
                currentUser?.id ?? 0, 
                currentUser?.role ?? '', 
                currentUser?.office ?? ''
            );
        if (currentUser?.role === "Admin") {
            allTasks = fetchedTasks
                ? Object.fromEntries(fetchedTasks.map(group => [group.officeName, group.tasks]))
                : {};
        } else {
            tasks.set(fetchedTasks ? fetchedTasks.flatMap(group => group.tasks) : []);
        }
}

export async function removeTask(taskId: number | null) {
    if(!taskId) {
        console.error("Cannot delete task id: ID is undefined");
        return;
    } else if(!confirm("Are you sure you want to delete this task?")) {
        return;
    } 
        try {
            await deleteTask(taskId);
            showToast({ type: "success", message: "Task and Notification card deleted successfully!" });
            await refreshTasks();
        } catch (error) {
            console.error("Error deleting task :", error);
            errorMessage = "Failed to delete task. Please try again later!";
        }
}

function transformGroupedTasks(data: any){
    return Object.entries(data).map(([officeName, tasks]) => ({officeName, tasks}))
}

export async function updateTask(id: number | undefined, taskData: TaskData): Promise<TaskResponse> {    
    const startDate = new Date(taskData.startDate);
    const endDate = new Date(taskData.endDate);

    if (endDate < startDate){
        showToast({ type: "error", message: "End Date Cannot Be Earlier Than The Start Date!" });
        return Promise.reject("End Date Validation Failed!");
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify(taskData),
        });
            if(!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update task!");
            }
            return await response.json();
    } catch (error) {
        console.error("Error updating task", error);
        throw error;
    }
}

export async function deleteTask(id: number) {
    const res = await fetch(`${API_URL}/tasks/${id}`, { 
        method: "DELETE",
    });
    if(!res.ok){
        throw new Error("Failed to Delete Task!")
    }
    return res.json();
}