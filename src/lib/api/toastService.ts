import { toasts } from "$lib/stores/toast";

type ToastInput = {
    type: string;
    message: string;
    duration?: number;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export async function showToast({ type, message, duration, onConfirm, onCancel }: ToastInput) {
        const id = Date.now();
        const toast = { id, type, message, duration, onConfirm, onCancel };

        toasts.update((current) => [...current, toast]);
        if(type !== 'confirm') {
            setTimeout(() => {
                toasts.update((current) => current.filter((toast) => toast.id !== id));
            },duration ?? 5000);    
        }
    }