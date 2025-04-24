<script lang="ts">
    import { notifications, loadNotifications } from '../lib/stores/notification';
    import { onMount } from 'svelte';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { get } from "svelte/store";

    export let userId: number;
    export let role: string;
    
    $: currentUser = get(user);
    // $: console.log('Current notifications:', $notifications);
    $: profilePicUrl = currentUser?.profilePic
    
    ? `http://localhost:3000${currentUser.profilePic}`
    : '/src/components/assets/default-avatar.png';
    
    let loading = false;
    let error: string | null = null;
    
    onMount(() => {
        if (!userId) {
            error = "No User ID provided.";
            loading = false;
            return;
        }

        const fetchNotifications = async () => {
            try {
                loading = false;
                await loadNotifications(userId, role);
            } catch (err) {
                error = "Failed to load notifications";
                console.error(err);
            } finally {
                loading = true;
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    });

    const weekDayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    async function markAsRead(id: number) {
        try { 
            const response = await fetch(`http://localhost:3000/notification/read/${id}`, { method: 'POST' });

            if(!response.ok) throw new Error('Failed to mark as unread.');
            await loadNotifications(userId, role);
        } catch (err) {
            console.error("Error marking notification as read: ", err);   
        }
    }
</script>

<div class="notification-container">
    {#if !loading}
        <p style="text-align: center;">Loading notifications...</p>
    {:else if error}
        <p style="text-align: center; color: red;">{error}</p>
    {:else}
        {#if $notifications.length === 0}
            <p style="text-align: center; color: red;">No notifications found!</p>
        {:else}
            <ul>
                {#each $notifications as note (note.id)}
                        <li class="notification-card" class:isRead={note.isRead}>
                            <div style="margin-left: 10px;">
                                <span>{weekDayFormatter.format(new Date(note.createdAt))}, {timeFormatter.format(new Date(note.createdAt))}</span>
                                <div class="pic-content">
                                    <span>
                                        <img src={profilePicUrl} alt="User Profile" class="user-pic">
                                    </span>
                                    <span class="content">{@html note.message}</span>
                                </div>
                                {#if !note.isRead}
                                    <button class="read" on:click={() => markAsRead(note.id)}>Mark as read</button>
                                {/if}
                            </div>
                        </li>
                {/each}
            </ul>
        {/if}
    {/if}
</div>

<style>
    .notification-container{
        /* border: 2px solid black; */
        overflow-y: auto;
        height: 250px;
    }

    .pic-content{
        margin-top: 7px;
        display: flex;
        gap: 10px;
    }

    .notification-card{
        padding: 10px 5px;
        margin-bottom: 5px;
        border: 2px solid black;
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    .isRead {
        opacity: 0.6;
        text-decoration: line-through;
    }
    
    .content{
        margin-top: 7px;
    }

    .read{
        cursor: pointer;
    }

    .user-pic{
        width: 40px;
        height: 40px;
        /* border-radius: 50%; */
        object-fit: cover;
        border: 1.5px solid #23BEDA;
        /* transition: transform 0.3s ease-in-out; */
    }
</style>
