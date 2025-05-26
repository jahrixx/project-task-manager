import { writable, get } from "svelte/store";

const API_URL = import.meta.env.VITE_BASE_URL;

interface Employee {
    id: number;
    name: string;
    officeName: string | null;
}

interface Manager {
    id: number;
    name: string;
    officeName: string | null;
}

interface Office {
    id: number;
    name: string;
}

interface Task {
    id: number;
    title: string;
    // Add other task properties as needed
}

export interface DashboardStats {
    employees: number;
    managers: number;
    offices: number;
    employeesList: Employee[];
    managersList: Manager[];
    officesList: Office[];
}

interface TaskCounts {
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    cancelledCount: number;
    overdueCount: number;
    archivedCount: number;
    pendingTasks: Task[];
    inProgressTasks: Task[];
    completedTasks: Task[];
    cancelledTasks: Task[];
    overdueTasks: Task[];
    archivedTasks: Task[];
    lastUpdated?: string;
}

export const dashboardStats = writable<DashboardStats>({
    employees: 0,
    managers: 0,
    offices: 0,
    employeesList: [],
    managersList: [],
    officesList: []
});

export const taskCounts = writable<TaskCounts>({
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    overdueCount: 0,
    archivedCount: 0,
    pendingTasks: [],
    inProgressTasks: [],
    completedTasks: [],
    cancelledTasks: [],
    overdueTasks: [],
    archivedTasks: []
});

export const lastUpdated = writable<string | null>(null);
export const error = writable<string | null>(null);

export async function fetchDashboardStats(): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/dashboard`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        const normalizedData: DashboardStats = {
            ...data,
            managersList: data.managersList.map((manager: Manager) => ({
                ...manager,
                officeName: manager.officeName || "No Office"
            })),
            employeesList: data.employeesList.map((employee: Employee) => ({
                ...employee,
                officeName: employee.officeName || "No Office"
            }))
        };

        dashboardStats.set(normalizedData);
        error.set(null);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch dashboard stats";
        console.error(message, err);
        error.set(message);
    }
}

export async function fetchTaskCounts(userId: number): Promise<void> {
    try {
        const currentLastUpdated = get(lastUpdated);
        const url = currentLastUpdated 
            ? `${API_URL}/tasks/status-count/${userId}?since=${encodeURIComponent(currentLastUpdated)}` 
            : `${API_URL}/tasks/status-count/${userId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TaskCounts & { lastUpdated?: string } = await response.json();

        taskCounts.set({
            pendingCount: data.pendingCount || 0,
            inProgressCount: data.inProgressCount || 0,
            completedCount: data.completedCount || 0,
            cancelledCount: data.cancelledCount || 0,
            overdueCount: data.overdueCount || 0,
            archivedCount: data.archivedCount || 0,
            pendingTasks: data.pendingTasks || [],
            inProgressTasks: data.inProgressTasks || [],
            completedTasks: data.completedTasks || [],
            cancelledTasks: data.cancelledTasks || [],
            overdueTasks: data.overdueTasks || [],
            archivedTasks: data.archivedTasks || []
        });

        if (data.lastUpdated) {
            lastUpdated.set(data.lastUpdated);
        }

        error.set(null);
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error('Error fetching task counts:', err);
        error.set(message);
    }
}