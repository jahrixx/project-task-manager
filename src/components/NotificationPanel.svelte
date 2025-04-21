<script lang="ts">
    import { notifications, loadNotifications } from '../lib/stores/notification';
    import { onMount } from 'svelte';

    export let userId: number;

    onMount(() => {
        if (!userId) return;

        loadNotifications(userId);
        const interval = setInterval(() => loadNotifications(userId), 5000);
        return () => clearInterval(interval);
    });

    async function markAsRead(id: number) {
        await fetch(`http://localhost:3000/notification/read/${id}`, { method: 'POST' });
        loadNotifications(userId);
    }
</script>

<div class="p-4 border rounded shadow">
    {#if $notifications.length === 0}
        <p>No notifications.</p>
    {:else}
        <ul>
            {#each $notifications as note (note.id)}
                <li class="flex justify-between items-center p-2 mb-1 bg-gray-100 rounded" class:isRead={note.isRead}>
                    <span>{note.message}</span>
                    {#if !note.isRead}
                        <button on:click={() => markAsRead(note.id)} class="text-blue-500">Mark as read</button>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .isRead {
        opacity: 0.6;
        text-decoration: line-through;
    }
</style>
