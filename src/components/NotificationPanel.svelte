<script lang="ts">
    import { onMount } from 'svelte';
    import { user} from '$lib/stores/user';
    import { get } from "svelte/store";
    import { removeNotification } from '$lib/api/notificationService';
    import { markNotificationAsRead, markNotificationAsUnread } from '$lib/api/notificationService';
    import { notifications, loadAdminNotifications, loadUserNotifications } from '../lib/stores/notification';
    import ToastContainer from './ToastContainer.svelte';

    export let userId: number;
    export let role: string;
    
    let loading = true;
    let initialized = true;
    let error: string | null = null;
    let hasData = false;
    let showMenu: number | null = null;
    let marking: Record<number, boolean> = {};
    
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

    function toggleMenu(noteId: number) {
        showMenu = showMenu === noteId ? null : noteId;
    }
    
</script>
<link rel="stylesheet" href="src/components/assets/css/notification-panel.css">
<div class="notification-container">
    <ToastContainer />
    {#if loading && !initialized}
        <p style="text-align: center">Loading Notifications...</p>
    {:else if error}
        <p style="text-align: center; color: red;">{error}</p>
    {:else if !hasData}
        <!-- <p style="text-align: center; color: red;">No Notifications Available!</p> -->
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading Notifications...</div>
        </div>
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
                                    <button class="more-options" on:click={() => toggleMenu(note.id)} aria-label="more-options">
                                        <svg width="20px" height="20px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#FFFFFF" fill-rule="evenodd" d="M3 8a2 2 0 100 4 2 2 0 000-4zm5 2a2 2 0 114 0 2 2 0 01-4 0zm7 0a2 2 0 114 0 2 2 0 01-4 0z"></path> </g></svg>
                                    </button>
                                    
                                    <button class="delete-notification" on:click={() => removeNotification(note.id)} aria-label="delete-notification">
                                        <svg width="20px" height="20px"viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#FFFFFF" d="M352 192V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64H96a32 32 0 0 1 0-64h256zm64 0h192v-64H416v64zM192 960a32 32 0 0 1-32-32V256h704v672a32 32 0 0 1-32 32H192zm224-192a32 32 0 0 0 32-32V416a32 32 0 0 0-64 0v320a32 32 0 0 0 32 32zm192 0a32 32 0 0 0 32-32V416a32 32 0 0 0-64 0v320a32 32 0 0 0 32 32z"></path></g></svg>
                                    </button>
                                    
                                    {#if showMenu ===  note.id}
                                        <!-- <div class="options-menu">
                                            {#if !note.isRead}
                                                <button class="read" on:click={() => markNotificationAsRead(note.id)}>Mark as read</button>
                                            {:else}
                                                <button class="read" on:click={() => markNotificationAsUnread(note.id)}>Mark as unread</button>
                                            {/if}
                                        </div> -->
                                        <div class="options-menu">
                                            {#if marking[note.id]}
                                                <button class="read" aria-label="loading-spinner-read" disabled>
                                                    <span class="loading-spinner-read"></span>
                                                </button>
                                            {:else}
                                                {#if !note.isRead}
                                                    <button class="read" on:click={async () => {
                                                        marking[note.id] = true;
                                                        await markNotificationAsRead(note.id);
                                                        marking[note.id] = false;
                                                    }}>Mark as read</button>
                                                {:else}
                                                    <button class="read" on:click={async () => {
                                                        marking[note.id] = true;
                                                        await markNotificationAsUnread(note.id);
                                                        marking[note.id] = false;
                                                    }}>Mark as unread</button>
                                                {/if}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            <div class="pic-content">
                                <span>
                                    <img src={note.profilePic ? `${import.meta.env.VITE_BASE_URL}${note.profilePic}` : '/src/components/assets/default-avatar.png'} alt="User Profile" class="user-pic">
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
                                            <span><b>By </b>: {note.firstName} {note.lastName}</span>
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
    @media screen and (max-width: 500px) and (min-width: 300px) {
        .pic-content{
            margin-top: 2px;
        }
        .pic-content img{
            border-radius: 50%;
            width: 35px;
            height: 35px;
            object-fit: cover;
        }
        .more-controls > button > svg {
            width: 15px;
            height: 15px;
        }
        .options-menu button {
            width: 90px;
            text-align: center;
            padding: 0.15rem;
            font-size: 12px;
        }
    }
    /* @media screen and (max-width: 320px) {
        
    } */
    .loading-spinner-read {
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid #3498db;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        animation: spin 0.6s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin: auto;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 250px;
        gap: 1rem;
    }

    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        font-size: 1rem;
        color: #555;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>