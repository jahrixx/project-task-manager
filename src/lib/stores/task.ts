import { writable } from "svelte/store";

export interface TaskData {
    id?: number | null;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    assignedTo: number | null;
    createdBy: number | null;
    assignedToName: string | null;
    createdByName: string | null;
    office?: string;
    creatorRole?: string | null;
    assigneeRole?: string | null;
    isArchived?: boolean | null;
}

export interface TaskResponse {
    message?: string;
    taskId?: number;
}

export const selectedStatuses = writable<string[]>([]);