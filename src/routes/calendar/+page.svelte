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
    let role = '';
    const currentUser = get(user);
    const userId = currentUser?.id ?? 0;

    onMount(async () => {  
        if(!isAuthenticated){
            goto('/login');
            return; 
        }
        
        const currentUser = get(user);
        const userId = currentUser?.id ?? 0;
        console.log("Current User ID: ", userId);
        role = currentUser?.role || '';

        try {
            const res = await fetchActivities(userId, role);
            activities = res;
            console.log("List of Recent Activities: ",activities);    
        } catch (error) {
            console.error("Error fetching activities: ", error);
        }
       
    });

</script>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/calendar.css">
</head>
<title>Task Calendar</title>
{#if !isAuthenticated}
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
<style>
    .task-calendar-container {
        margin: 15px;
        /* height: 70vh;
        border: 1px solid black;     */
    }

    @media screen and (max-width: 700px) and (min-width: 300px) {
        .main-container {margin: 0;}
    }
</style>
