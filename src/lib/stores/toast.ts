import { writable } from "svelte/store";

export type Toast = {
    id: number;
    type: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    duration?: number;
};

export const toasts = writable<Toast[]>([]);
