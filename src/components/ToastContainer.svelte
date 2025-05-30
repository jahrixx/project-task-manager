<script lang="ts">
    import { fly } from 'svelte/transition';
    export let toasts: any[] = [];
    
    function dismiss(id: number) {
        toasts = toasts.filter(t => t.id !== id);
    }
</script>

<div class="toast-container">
    {#each toasts as toast (toast.id)}
        <div class="toast {toast.type}" in:fly={{ x: 200, duration: 300 }} out:fly={{ x: 200, opacity: 0, duration: 300 }}>
            <span>{toast.message}</span>
            <button class="close-btn" on:click={() => dismiss(toast.id)}>×</button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: 7rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
    .toast {
        background-color: crimson;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        padding: .75rem 1rem;
        margin-bottom: .5rem;
        border-radius: 8px;
        color: #ffffffaa;
        font-size: 1rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-in-out;
    }
    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 .5rem;
        line-height: 1;
    }
    .close-btn:hover {
        color: #ffffff;
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