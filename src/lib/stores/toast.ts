import { writable } from "svelte/store";

export type Toast = {
    id: number;
    type: string;
    message: string;
};

export const toasts = writable<Toast[]>([]);
