import { writable } from "svelte/store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/dashboard";

export interface DashboardStats {
    employees: number;
    managers: number;
    offices: number;
    employeesList: { 
        id: number; 
        name: string; 
        officeName: string | null; 
    }[];
    managersList: { 
        id: number; 
        name: string; 
        officeName: string | null;
    }[];
    officesList: { 
        id: number; 
        name: string; 
    }[];
}

export const dashboardStats = writable<DashboardStats>({
    employees: 0,
    managers: 0,
    offices: 0,
    employeesList: [],
    managersList: [],
    officesList: []
});

export async function fetchDashboardStats() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();

        data.managersList = data.managersList.map((manager: any) => ({
            ...manager,
            officeName: manager.officeName || "No Office"
        }));

        data.employeesList = data.employeesList.map((employee: any) => ({
            ...employee,
            officeName: employee.officeName || "No Office"
        }));

        dashboardStats.set(data);
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
    }
}
