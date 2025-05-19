<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, isAuthenticated, userRole } from '$lib/stores/user';
    import { dashboardStats, fetchDashboardStats } from '$lib/api/dashboardService';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    import RecentActivities from '../../components/RecentActivities.svelte';
    import CurrentTasks from "../../components/CurrentTasks.svelte";
    import { get } from 'svelte/store';
    import { fetchActivities } from '$lib/api/activityService';
    import NotificationPanel from '../../components/NotificationPanel.svelte';

    let pendingTasks: {id: number, title: string }[] = [];
    let inProgressTasks: {id: number, title: string }[] = [];
    let completedTasks: {id: number, title: string }[] = [];
    let archivedTasks: {id: number, title: string }[] = [];
    let overdueTasks: {id: number, title: string }[] = [];
    let cancelledTasks: {id: number, title: string }[] = [];

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let archivedCount = 0;
    let overdueCount = 0;
    let cancelledCount = 0;

    let error = null;
    let lastUpdated: string | null = null;
    
    let activeModal = '';
    let activities: any = [];
    let role = '';
    const currentUser = get(user);
    const userId = currentUser?.id ?? 0;

    $: if (get(isAuthenticated) && ($userRole === 'Manager' || $userRole === 'Employee')){
            fetchTaskCounts(userId);
        }

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
        
        if ($userRole === 'Admin') {
            fetchDashboardStats();
        } else {
            fetchTaskCounts(userId);
        }
    });

    function toggleModal(type: string) {
        activeModal = activeModal === type ? '' : type;
    }

    async function fetchTaskCounts(userId: number) {
        try {
            const url = lastUpdated ? `http://localhost:3000/tasks/status-count/${userId}?since=${encodeURIComponent(lastUpdated)}` : `http://localhost:3000/tasks/status-count/${userId}`;
            const response = await fetch(url);
        
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }

            const data = await response.json();
            
            pendingCount = data.pendingCount;
            inProgressCount = data.inProgressCount;
            completedCount = data.completedCount;
            cancelledCount = data.cancelledCount;
            overdueCount = data.overdueCount;
            archivedCount = data.archivedCount;

            pendingTasks = data.pendingTasks || [];
            inProgressTasks = data.inProgressTasks || [];
            completedTasks = data.completedTasks || [];
            cancelledTasks = data.cancelledTasks || [];
            overdueTasks = data.overdueTasks || [];
            archivedTasks = data.archivedTasks || [];
            
            if (data.lastUpdated) {
                lastUpdated = data.lastUpdated;
            }

            error = null;
        } catch (err) {
            console.error('Error fetching task counts:', err);
            error = err instanceof Error ? err.message : 'An unexpected error occurred.';
        }
    }

    // console.log(Notification.permission);

    // if(Notification.permission === 'granted'){
    //     alert("We have permission");
    // } else if (Notification.permission !== 'denied'){
    //     Notification.requestPermission().then(Permissions => {
    //         console.log(Permissions);
    //     });
    // }
</script>

<title>Dashboard</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/dashboard.css">
</head>
{#if !isAuthenticated}
    <Login />
{:else}
    {#if $userRole === 'Admin'}
        <div class="container">
            <Sidebar />
            <div class="main-container">
                <UserProfile />
                <div class="dash-controls">
                    <div class="task-card">
                        <!-- <span class="circle">No.</span> -->
                        <span class="task-text">No. of Managers</span>
                        <button class="add-btn" on:click={() => toggleModal('Managers')}>
                            {#if activeModal === 'Managers'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$dashboardStats.managers}
                            {/if}
                        </button>
                        {#if activeModal === 'Managers'}
                            <div class="overlay">
                                {#each $dashboardStats.managersList as manager, index}
                                    <p>{index + 1}. {manager.name} - <i>{manager.officeName}</i></p>
                                {/each}
                            </div> 
                        {/if}
                    </div>
                    <div class="task-card">
                        <!-- <span class="circle">No.</span> -->
                        <span class="task-text">No. of Employees</span>
                        <button class="add-btn" on:click={() => toggleModal('Employees')}>
                            {#if activeModal === 'Employees'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$dashboardStats.employees}
                            {/if}
                        </button>
                        {#if activeModal === 'Employees'}
                            <div class="overlay">
                                {#each $dashboardStats.employeesList as employee, index}
                                    <p>{index + 1}. {employee.name} - <i>{employee.officeName}</i></p>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card">
                        <!-- <span class="circle">No.</span> -->
                        <span class="task-text">No. of Offices</span>
                        <button class="add-btn" on:click={() => toggleModal('Offices')}>
                            {#if activeModal === 'Offices'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$dashboardStats.offices}
                            {/if}
                        </button>
                        {#if activeModal === 'Offices'}
                            <div class="overlay">
                                {#each $dashboardStats.officesList as office, index}
                                    <p>{index + 1}. {office.name}</p>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="activities">
                    <h2 style="margin: auto; width: 92%; padding-bottom: 11px;">Recent Activities</h2>
                    <hr style="height: 3px; width: 92%; background-color: lightgray; margin: auto;">
                    <div class="container-recent-activities" style="margin: auto; width: 90%;">
                        <RecentActivities {activities} {role}/>
                    </div>
                </div>
                <div class="section">
                    <div class="current-task-and-notifications">
                        <h2 style="margin: auto; width: 100%;">All Offices Current Tasks<hr style="height: 3px; background-color: lightgray;"></h2>
                        <div class="current-task-list">
                            <CurrentTasks />
                        </div>
                    </div>
                    <div class="notification">
                        <h2 style="margin: auto; width: 100%;">Notifications<hr style="height: 3px; background-color: lightgray;"></h2>
                        <div class="notification-list-admin">
                            <NotificationPanel {userId} {role}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>            
    {/if}
    {#if $userRole === 'Manager' || $userRole === 'Employee'}
        <div class="container">
            <Sidebar />
            <div class="main-container">
                <UserProfile />
                <div class="dash-controls-emp">
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Pending Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Pending")}>
                            {#if activeModal === 'Pending'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {pendingCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Pending'}
                            <div class="overlay-top">
                                {#if pendingTasks.length > 0}
                                    {#each pendingTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #FF7518;"><b>No Pending Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">In Progress Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("inProgress")}>
                            {#if activeModal === 'inProgress'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {inProgressCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'inProgress'}
                            <div class="overlay-top">
                                {#if inProgressTasks.length > 0}
                                    {#each inProgressTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #1434A4;"><b>No In Progress Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Completed Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Completed")}>
                            {#if activeModal === 'Completed'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {completedCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Completed'}
                            <div class="overlay-top">
                                {#if completedTasks.length > 0}
                                    {#each completedTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #00A36C;"><b>No Completed Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Archived Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Archived")}>
                            {#if activeModal === 'Archived'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {archivedCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Archived'}
                            <div class="overlay-bottom">
                                {#if archivedTasks.length > 0}
                                    {#each archivedTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #175E88"><b>No Archived Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Cancelled Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Cancelled")}>
                            {#if activeModal === 'Cancelled'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {cancelledCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Cancelled'}
                            <div class="overlay-bottom">
                                {#if cancelledTasks.length > 0}
                                    {#each cancelledTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #E34234"><b>No Cancelled Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Overdue Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Overdue")}>
                            {#if activeModal === 'Overdue'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {overdueCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Overdue'}
                            <div class="overlay-bottom">
                                {#if overdueTasks.length > 0}
                                    {#each overdueTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #C41E3A"><b>No Overdue Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="activities">
                    <h2 style="margin: auto; width: 92%; padding-bottom: 11px;">Recent Activities</h2>
                    <hr style="height: 3px; width: 92%; background-color: lightgray; margin: auto;">
                    <div class="container-recent-activities" style="margin: auto; width: 92%;">
                        <RecentActivities {activities} {role}/>
                    </div>
                </div>
                <!-- <div class="current-task-and-notifications">
                    <h2 style="margin: auto; width: 100%;">Current Tasks<hr style="height: 3px; background-color: lightgray;"></h2>
                    <div class="current-task-list-emp"style="margin: auto; width: 100%;">
                        <CurrentTasks />
                    </div>
                </div> -->
                <div class="section">
                    <div class="current-task-and-notifications">
                        <h2 style="margin: auto; width: 100%;">Current Tasks<hr style="height: 3px; background-color: lightgray;"></h2>
                        <div class="current-task-list-emp">
                            <CurrentTasks />
                        </div>
                    </div>
                    <div class="notification">
                        <h2 style="margin: auto; width: 100%;">Notifications<hr style="height: 3px; background-color: lightgray;"></h2>
                        <div class="notification-list">
                            <NotificationPanel {userId} {role}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{/if}
<style>
    .container-recent-activities{
        padding-top: 2.5px;
        height: 90px;
        overflow-y: auto;
        /* border: 1px solid black; */
    }

    .notification-list-admin {
        height: 305px; 
        overflow-y: auto;
        /* border: 1px solid black; */
    }

    .notification-list{
        height: 275px; 
        overflow-y: auto;
        /* border: 1px solid black; */
        
    }

    .current-task-list{
        height: 305px; 
        /* border: 1px solid black; */
    }

    .current-task-list-emp{
        height: 275px; 
        /* border: 1px solid black; */
    }

    .container-recent-activities::-webkit-scrollbar,
    .notification-list::-webkit-scrollbar,
    .notification-list-admin::-webkit-scrollbar {
        width: 0;
        background: transparent;
    }

    @media screen and (max-width: 500px) and (min-width: 300px) {
        .main-container {margin: 0;}
        .activities {
            width: 100%;
        }
        .dash-controls-emp {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 2px;
            margin-bottom: 20px;
        }
        .task-card-emp{
            width: 90%;
            margin: 0;
        }

        .section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
        }

        .current-task-and-notifications,
        .notification {
            width: 100%;
            margin-left: 0;
        }

        .current-task-list-emp,
        .notification-list {
            width: 100%;
            overflow-x: auto;
        }

        h2 {
            font-size: 1.1rem;
            text-align: center;
            margin-bottom: 0.5rem;
        }
        hr {
            margin-top: .25rem;
            margin-bottom: .5rem;
            width: 100%;
        }

        /* .dash-controls, .dash-controls-emp {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        } */
    }
</style>