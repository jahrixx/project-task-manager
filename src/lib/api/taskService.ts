import { writable } from "svelte/store";
import type { TaskData, TaskResponse } from "$lib/stores/task";
import { json } from "@sveltejs/kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const tasks = writable<TaskData[]>([]);

// Function to create a new task
export async function createTask(taskData: TaskData): Promise<TaskResponse> {
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


export async function fetchTasks(userId: number | null, role: string | null, office: string | null): Promise<void> {
    try {
        const userIdParam = userId ?? 0;
        const roleParam = role ?? "";
        const officeParam = office ?? "";

        const response = await fetch(`${API_URL}/tasks?userId=${userIdParam}&role=${roleParam}&office=${officeParam}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch tasks.");
        }

        let data = await response.json();
        const today = new Date();

        data = data.map((task: any) => {
            const endDate = new Date(task.endDate);
        
            if (task.status === "Completed" || task.status === "Cancelled") {
                return task;
            }

            if (endDate <= today) {
                task.status = "Overdue";
            }

            return task;
        });

        tasks.set(data);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
    }
}

//Update Task
export async function updateTask(id: number | undefined, taskData: TaskData): Promise<TaskResponse> {
    console.log("Updating Task with ID :", id);

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
        // headers: {"Content-Type" : "application/json"},
        // body: JSON.stringify({ createdBy, assignedTo }), 
    });

    if(!res.ok){
        throw new Error("Failed to Delete Task!")
    }

    return res.json();
}

//Delete Task
// export async function deleteTask(id: number | undefined): Promise<void> {
//     if (id === undefined) {
//         console.error("Cannot delete task: Task ID is undefined.");
//         return;
//     }

//     try {
//         const response = await fetch(`${API_URL}/tasks/${id}`, {
//             method: "DELETE",
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || "Failed to delete task.");
//         }

//         console.log(`Task with ID ${id} deleted successfully!`);
//     } catch (error) {
//         console.error("Error deleting task:", error);
//         throw error;
//     }
// }
