export interface TaskData {
    id: number | null;
    title: string;
    description: string;
    startDate: string | null; // JSON responses typically use ISO string format
    endDate: string | null;
    status: string;
    assignedTo: number | null;
    createdBy: number | null;
    assignedToName: string | null;
    createdByName: string | null;
}

export interface TaskResponse {
    message?: string;
    taskId?: number; // Ensure this matches the DB type
}
