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
<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/calendar.css">
    <title>Task Calendar</title>
</svelte:head>

{#if loading}
    <div class="fullpage-loader">
        <div class="spinner"></div>
    </div>
{:else}
    {#if !authed}
        <Login />
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
{/if}
