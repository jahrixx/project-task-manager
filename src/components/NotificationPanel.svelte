<script lang="ts">
    import { notifications, loadAdminNotifications, loadUserNotifications, type Notification } from '../lib/stores/notification';
    import { onMount } from 'svelte';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { get } from "svelte/store";
    import { removeNotification } from '$lib/api/notificationService';
    
    export let userId: number;
    export let role: string;
    
    const API_BASE_URL = 'http://localhost:3000';
    
    let loading = true;
    let initialized = true;
    let error: string | null = null;
    let hasData = false;
    let showMenu: number | null = null;
    
    onMount(() => {
        const currentUser = get(user);
        role = currentUser?.role ?? '';
        let cancelled = false;

        const fetchNotifications = async () => {
            try {
                loading = true;
                if (role === "Admin") {
                    await loadAdminNotifications();
                } else {
                    await loadUserNotifications(userId);
                }

                hasData = $notifications.length > 0;
                if (!cancelled) {
                    error = null;
                }
            } catch (err) {
                if (!cancelled) {
                    error = "Failed to load notifications.";
                    console.error("Notification loading error", err);
                }
            } finally {
                if (!cancelled) {
                    loading = false;
                    initialized = true;
                }
            }
        };

        console.log("Current User Role: ", role);
        
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 5000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    });

    const weekDayFormatter = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        month: 'long',
        day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    async function markNotificationAsRead(id: number) {
        try { 
            const response = await fetch(`http://localhost:3000/notification/read/${id}`, { method: 'POST' });

            if(!response.ok) throw new Error('Failed to mark as unread.');
            if (role === "Admin") {
                await loadAdminNotifications();
            } else {
                await loadUserNotifications(userId);
            }
        } catch (err) {
            console.error("Error marking notification as read: ", err);   
        }
    }

    async function markNotificationAsUnread(id: number) {
        try { 
            const response = await fetch(`http://localhost:3000/notification/unread/${id}`, { method: 'POST' });

            if(!response.ok) throw new Error('Failed to mark as unread.');
            if (role === "Admin") {
                await loadAdminNotifications();
            } else {
                await loadUserNotifications(userId);
            }
        } catch (err) {
            console.error("Error marking notification as read: ", err);   
        }
    }

    function toggleMenu(noteId: number) {
        showMenu = showMenu === noteId ? null : noteId;
    }
    
</script>

<div class="notification-container">
    {#if loading && !initialized}
        <p style="text-align: center">Loading Notifications...</p>
    {:else if error}
        <p style="text-align: center; color: red;">{error}</p>
    {:else if !hasData}
        <p style="text-align: center; color: red;">No Notifications Available!</p>
    {:else}
        <ul>
            {#each $notifications as note (note.id)}
                    <li class="notification-card" class:isRead={note.isRead}>
                        <div style="margin-left: 10px;">
                            <div class="container-time-controls">
                                <div class="date-time">
                                    <span style="color: #175E88; font-weight: 600;">{weekDayFormatter.format(new Date(note.createdAt))} : {timeFormatter.format(new Date(note.createdAt))}</span>
                                    <br>
                                </div>
                                <div class="more-controls">
                                    <button aria-label="More options" on:click={() => toggleMenu(note.id)}>
                                       <span>…</span>
                                    </button>
                                    
                                    <!-- <button aria-label="Close">
                                        <span>x</span>
                                    </button> -->
                                    
                                    {#if showMenu ===  note.id}
                                        <div class="options-menu">
                                            {#if !note.isRead}
                                                <button class="read" on:click={() => markNotificationAsRead(note.id)}>Mark as read</button>
                                                <button class="read" on:click={() => removeNotification(note.id)}>Delete Notification</button>    
                                            {:else}
                                                <button class="read" on:click={() => markNotificationAsUnread(note.id)}>Mark as unread</button>
                                                <button class="read" on:click={() => removeNotification(note.id)}>Delete Notification</button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            <div class="pic-content">
                                <span>
                                    <img src={note.profilePic ? `http://localhost:3000${note.profilePic}` : '/src/components/assets/default-avatar.png'} alt="User Profile" class="user-pic">
                                </span>
                                <span class="content">
                                    {@html note.message}
                                </span>
                            </div>
                            <div class="notification-sender">
                                <span style="color: black; font-size: 11px;">
                                    {#if note.type === 'task_assigned'}
                                        <span><b>Assigned By {note.creatorRole}</b>: {note.creatorFirstName} {note.creatorLastName}</span>

                                    {:else if note.type === 'task_assignment_confirmation'}
                                        <span><b>Assigned To</b>: {note.assigneeFirstName} {note.assigneeLastName}</span>

                                    {:else if note.type === 'task_self_assigned'}
                                        {#if role === 'Employee'}
                                            <span><b>Employee Personal Task</b></span>
                                        {:else}
                                            <span><b>Personal Task By</b>: {note.firstName} {note.lastName}</span>
                                        {/if}
                                    {:else}    
                                        {#if role === 'Admin'}
                                            <span><b>{note.creatorRole}</b>: {note.firstName} {note.lastName}</span>
                                        {:else}
                                            <span><b>By {note.creatorRole}</b>: {note.firstName} {note.lastName}</span>
                                        {/if}
                                    {/if}
                                </span>
                            </div>
                        </div>
                    </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .notification-container{
        overflow-y: auto;
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
    
    .content{
        margin-top: 1.5px;
    }

    .isRead {
        opacity: 0.6;
        text-decoration: line-through;
    }
    
    .read{
        cursor: pointer;
        background: none;
        border: none;
        width: 250px;
    }



    .user-pic{
        width: 40px;
        height: 40px;
        object-fit: cover;
        border: 1.5px solid #175E88;
    }

    .more-controls {
        position: relative;
        display: inline-block;
    }

    .options-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 3px;
        background: #ffffff;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        padding: 0.25rem;
        min-width: 90px;
        z-index: 200;
    }

    .options-menu button {
        width: 106px;
        text-align: center;
        padding: 0.25rem;
        background: none;
        border: none;
        color: #333;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .options-menu button:hover {
        background-color: #f0f0f0;
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
