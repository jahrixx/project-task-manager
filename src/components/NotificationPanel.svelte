<script lang="ts">
    import { notifications, loadNotifications, type Notification } from '../lib/stores/notification';
    import { onMount } from 'svelte';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { get } from "svelte/store";

    export let userId: number;
    export let role: string;
    
    $: currentUser = get(user);
    $: profilePicUrl = currentUser?.profilePic
    
    ? `http://localhost:3000${currentUser.profilePic}`
    : '/src/components/assets/default-avatar.png';
    
    let loading = true;
    let error: string | null = null;
    let hasData = false;
    
    onMount(() => {
        if (!userId) {
            error = "No User ID provided.";
            loading = false;
            return;
        }

        const fetchNotifications = async () => {
            try {
                loading = true;
                await loadNotifications(userId, role);
                hasData =  $notifications.length > 0;
                error = null;
            } catch (err) {
                error = "Failed to load notifications";
                console.error(err);
            } finally {
                loading = false;
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
    {#if loading && !hasData}
        <p style="text-align: center;">Loading notifications...</p>
    {:else if error}
        <p style="text-align: center; color: red;">{error}</p>
    {:else if !hasData}
            <p style="text-align: center; color: red;">No notifications found!</p>
        {:else}
        <ul>
            {#each $notifications as note (note.id)}
                    <li class="notification-card" class:isRead={note.isRead}>
                        <div style="margin-left: 10px;">
                            <div class="container-time-controls">
                                <div class="date-time">
                                    <span style="color: #175E88; font-weight: 600;">{weekDayFormatter.format(new Date(note.createdAt))}, {timeFormatter.format(new Date(note.createdAt))}</span>
                                </div>
                                <div class="more-controls">
                                    <button aria-label="More options">
                                       <span>…</span>
                                    </button>
                                    <button aria-label="Close">
                                        <span>x</span>
                                     </button>
                                </div>
                            </div>
                            <div class="pic-content">
                                <span>
                                    <img src={note.profilePic ? `http://localhost:3000${note.profilePic}` : '/src/components/assets/default-avatar.png'} alt="User Profile" class="user-pic">
                                </span>
                                <span class="content">
                                    <!-- {#if role === "Admin"}
                                        {note.firstName} {note.lastName}:
                                    {/if} -->
                                    {@html note.message}
                                </span>
                            </div>
                            <!-- {#if !note.isRead}
                                <button class="read" on:click={() => markAsRead(note.id)}>Mark as read</button>
                            {/if} -->
                        </div>
                    </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .notification-container{
        /* border: 2px solid black; */
        /* border-radius: 10px; */
        /* background-image: linear-gradient(#FFFFFF, rgba(23, 94, 136, 0.40)); */
        overflow-y: auto;
        /* height: 250px; */
    }

    .notification-container::-webkit-scrollbar {
        width: 0;
        background: transparent;
    }

    .pic-content{
        margin-top: 7px;
        display: flex;
        gap: 10px;
    }

    .notification-card{
        /* border: 2px solid black; */
        padding: 10px 5px;
        margin-bottom: 5px;
        background-color: rgba(23, 94, 136, 0.50);
        width: 88%;
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin: auto;
    }

    .isRead {
        opacity: 0.6;
        text-decoration: line-through;
    }
    
    .content{
        margin-top: 1.5px;
    }
/* 
    .read{
        cursor: pointer;
    } */

    .user-pic{
        width: 40px;
        height: 40px;
        object-fit: cover;
        border: 1.5px solid #175E88;
        /* border-radius: 50%; */
        /* transition: transform 0.3s ease-in-out; */
    }

    .more-controls > button{
        background: none;
        border: none;
        cursor: pointer;
    }

    .more-controls > button > span {
        display: inline-block;
        line-height: 1;
        font-weight: bolder;
        font-size: 20px;
        color: #FFFFFF;
        vertical-align: middle;
    }

    .container-time-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
</style>
