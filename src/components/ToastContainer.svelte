<script lang="ts">
    import { fly, scale } from 'svelte/transition';
    import { toasts } from '$lib/stores/toast';
    
    function dismiss(id: number) {
        toasts.update((all) => all.filter((t) => t.id !== id));
        // toasts = toasts.filter(t => t.id !== id);
    }
</script>

<div class="toast-container">
    {#each $toasts as toast (toast.id)}
        {#if toast.type === 'confirm'}
            <div
                class="toast confirm"
                in:scale={{ duration: 250 }}
                out:fly={{ y: -20, opacity: 0, duration: 250 }}
            >
                <div class="toast-message">
                    <span>{@html toast.message}</span>
                </div>
                <div class="toast-confirm-actions">
                    <button on:click={() => { toast.onConfirm?.(); dismiss(toast.id); }} class="btn confirm">
                        Confirm
                    </button>
                    <button on:click={() => { toast.onCancel?.(); dismiss(toast.id); }} class="btn cancel">
                        Cancel
                    </button>
                </div>
            </div>
        {:else}
            <div
                class="toast {toast.type}"
                in:fly={{ x: 200, duration: 300 }}
                out:fly={{ x: 200, opacity: 0, duration: 300 }}
            >
                <span>{@html toast.message}</span>
                <button class="close-btn-toast {toast.type === 'logout' ? 'top-right' : ''}" on:click={() => dismiss(toast.id)}>×</button>
            </div>
        {/if}
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: 3.2rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
    .toast {
        display: flex;
        flex-direction: column;
        position: relative;
        min-width: 300px;
        padding: .75rem 1rem;
        border-radius: 8px;
        font-size: 1.05rem;
        color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .toast.success    { background-color: #28a745; }
    .toast.read       { background-color: #D3D3D3; color: #6082B6; }
    .toast.error      { background-color: #dc3545; }
    .toast.info       { background-color: #17a2b8; color: #2c3e50; padding-right: 2.5rem; }
    .toast.warning    { background-color: #ffc107; color: #333; }
    .toast.logout     { background-color: #ffffff; color: #dc3545; }
    .toast.confirm {
        position: fixed;
        top: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        min-width: 350px;
        max-width: 90vw;
        padding: 1rem .5rem;
        border-radius: 10px;
        background-color: rgba(35, 190, 218, 0.8);
        border: 1px solid #2c3e50;
        color: #333;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        animation: fadeInSlide 0.3s ease;
    }
    .toast-message {
        font-weight: 500;
        margin-bottom: 0.75rem;
    }
    .toast-confirm-actions {
        margin-top: .5rem;
        display: flex;
        gap: 0.75rem;
    }
    .toast.confirm .btn {
        padding: 0.4rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }
    .toast.confirm .btn.confirm {
        border: 1px solid #4169E1;
        background: rgba(255, 255, 255, 0.5);
        color: #4169E1;
    }
    .toast.confirm .btn.cancel {
        border: 1px solid #C41E3A;
        background: rgba(255, 255, 255, 0.5);
        color: #C41E3A;
    }
    .toast.confirm .btn.confirm:hover {
        border: none;
        background: #4169E1;
        color: #FFFFFF;
    }
    .toast.confirm .btn.cancel:hover {
        border: none;
        background: #C41E3A;
        color: #FFFFFF;
    }
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
    }
    .close-btn-toast {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        color: inherit;
        font-size: 1.7rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    .toast.confirm .btn:hover {
        opacity: 0.9;
    }
    @keyframes fadeInSlide {
        from {
            opacity: 0;
            transform: translate(-50%, -20%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @media screen and (max-width: 500px) and (min-width: 300px) {
        .toast-container {
            top: .5rem;
            right: .5rem;
        }

        .toast {
            min-width: 150px;
            font-size: .8rem;
        }
    }
</style>
