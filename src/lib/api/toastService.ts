import { toasts } from "$lib/stores/toast";

export async function showToast({ type, message }: { type: string; message: string }) {
        const id = Date.now();
        toasts.update((current) => [...current, { id, type, message }]);

        setTimeout(() => {
            toasts.update((current) => current.filter((toast) => toast.id !== id));
            // toasts = toasts.filter((toast) => toast.id !== id);
        }, 5000);
    }