import { writable } from "svelte/store";
import type { TaskData, TaskResponse } from "$lib/stores/task";
import { isAuthenticated, user, type User } from "$lib/stores/user";
import { derived, get } from "svelte/store";
import { json } from "@sveltejs/kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const tasks = writable<TaskData[]>([]);
export let allTasks: Record<string, TaskData[]> = {}; 
export let errorMessage= '';

export async function createTask(taskData: TaskData): Promise<TaskResponse> {    
    // Convert dates to Date objects for validation
    const startDate = new Date(taskData.startDate);
    const endDate = new Date(taskData.endDate);

    if(endDate.getTime() < startDate.getTime()){
        alert("End Date Cannot Be Earlier Than The Start Date!");
        return Promise.reject("End Date Validation Failed!")
    } else if(endDate.getTime() === startDate.getTime()){
        alert("Start Date Cannot Be Equal To End Date!");
        return Promise.reject("End Date Validation Failed!")
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

// Function to fetch employees based on office ID
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
        // let response: any = [];
           
        const response = await fetch(`${API_URL}/tasks?userId=${userIdParam}&role=${roleParam}&office=${officeParam}`);
    
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch tasks.");
        }

        const data = await response.json();
        console.log("Data Fetched: ", data);

        if(role !== "Admin"){
            data.forEach((task: TaskData) => {
                const now = new Date();
                const endDate = new Date(task.endDate);
    
                // if(task.status !== "Completed"){
                //     if (endDate < now) {
                //         task.status = "Overdue";
                //     }
                //     if(endDate.toDateString() === now.toDateString()){
                //         task.status = "Due Today";
                //     } else if(endDate < now){
                //         task.status = "Overdue";
                //     }
                // }
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
            console.log("Fetched tasks after execution:", fetchedTasks);

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
            alert("Task deleted successfully");
            await refreshTasks();
        } catch (error) {
            console.error("Error deleting task :", error);
            errorMessage = "Failed to delete task. Please try again later!";
        }
}

function transformGroupedTasks(data: any){
    return Object.entries(data).map(([officeName, tasks]) => ({officeName, tasks}))
}

//Update Task
export async function updateTask(id: number | undefined, taskData: TaskData): Promise<TaskResponse> {
    console.log("Updating Task with ID :", id);
    
    // Convert dates to Date objects for validation
    const startDate = new Date(taskData.startDate);
    const endDate = new Date(taskData.endDate);

    if (endDate < startDate){
        alert("End Date Cannot Be Earlier Than The Start Date!");
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

//Delete Task
export async function deleteTask(id: number) {
    const res = await fetch(`${API_URL}/tasks/${id}`, { 
        method: "DELETE",
    });

    if(!res.ok){
        throw new Error("Failed to Delete Task!")
    }
    return res.json();
}