<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, isAuthenticated } from '$lib/stores/user';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    import { get } from 'svelte/store';
    import { fetchActivities } from '$lib/api/activityService';
    import TaskCalendar from '../../components/TaskCalendar.svelte';
    
    let activities: any = [];
    let loading = true;
    let authed = false;
    let role = '';

    onMount(async () => {  
        authed = get(isAuthenticated);

        if(!authed){
            loading = false;
            // goto('/login');
            return; 
        }
        
        const currentUser = get(user);
        const userId = currentUser?.id ?? 0;
        role = currentUser?.role || '';

        try {
            const res = await fetchActivities(userId, role);
            activities = res;
        } catch (error) {
            console.error("Error fetching activities: ", error);
        } finally {
            loading = false;
        }
    });

</script>
<title>Task Calendar</title>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/calendar.css">
</head>

{#if !authed}
<Login />
{:else if loading}
    <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading Application Data...</p>
    </div>
{:else}
    <div class="container">
        <Sidebar />
        <div class="main-container">
                <UserProfile />
                <h2 class="h2"><u>Task Calendar</u></h2>
            <div class="task-calendar-container">
                <TaskCalendar />  
            </div>
        </div>
    </div>  
{/if}
<style>
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .loading-spinner {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
