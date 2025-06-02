<script lang="ts">
    import { fly } from 'svelte/transition';
    import { toasts } from '$lib/stores/toast';
    
    function dismiss(id: number) {
        toasts.update((all) => all.filter((t) => t.id !== id));
        // toasts = toasts.filter(t => t.id !== id);
    }
</script>

<div class="toast-container">
    {#each $toasts as toast (toast.id)}
        <div class="toast {toast.type}" in:fly={{ x: 200, duration: 3000 }} out:fly={{ x: 200, opacity: 0, duration: 300 }}>
            <span>{@html toast.message}</span>
            <button class="close-btn-toast {toast.type === 'info' ? 'top-right' : ''}" on:click={() => dismiss(toast.id)}>×</button>
        </div>
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
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        padding: .75rem 1rem;
        margin-bottom: .5rem;
        border-radius: 8px;
        color: #fff;
        font-size: 1rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-in-out;
    }

    .toast.success {
        background-color: #28a745; 
    }

    .toast.read {
        background-color: #D3D3D3;
        color: #6082B6; 
    }

    .toast.error {
        background-color: #dc3545; 
    }

    .toast.info {
        background-color: #17a2b8; 
        color: rgb(44, 62, 80);
        position: relative;
        padding-right: 2.5rem;
    }

    .toast.warning {
        background-color: #ffc107; 
        color: #333;
    }

    .close-btn-toast.top-right {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
    }

    .close-btn-toast {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .close-btn-toast:hover {
        color: #fff;
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
