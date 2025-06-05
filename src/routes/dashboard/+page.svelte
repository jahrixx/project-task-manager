<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, isAuthenticated, userRole } from '$lib/stores/user';
    import { dashboardStats, fetchDashboardStats, fetchTaskCounts, taskCounts } from '$lib/api/dashboardService';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    import RecentActivities from '../../components/RecentActivities.svelte';
    import CurrentTasks from "../../components/CurrentTasks.svelte";
    import { get } from 'svelte/store';
    import { fetchActivities } from '$lib/api/activityService';
    import NotificationPanel from '../../components/NotificationPanel.svelte';

    let activeModal = '';
    let activities: any = [];
    let role = '';
    let loading = true;
    let authed = false;
    const currentUser = get(user);
    const userId = currentUser?.id ?? 0;

    $: if (get(isAuthenticated) && ($userRole === 'Manager' || $userRole === 'Employee')){
            fetchTaskCounts(userId);
        }

    onMount(async () => {
        authed = get(isAuthenticated);
        if(!authed){
            loading = false;
            return; 
        }
        try {
            const currentUser = get(user);
            const userId = currentUser?.id ?? 0;
            role = currentUser?.role || '';

            if ($userRole === 'Admin') {
                fetchDashboardStats();
            } else {
                fetchTaskCounts(userId);
            }
            const res = await fetchActivities(userId, role);
            activities = res;
        } catch (error) {
            console.error("Error fetching activities: ", error);
        } finally {
            loading = false;
        }
    });

    function toggleModal(type: string) {
        activeModal = activeModal === type ? '' : type;
    }
</script>

<title>Dashboard</title>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/dashboard.css">
</head>

{#if !authed}
    <Login />
{:else if loading}
    <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading Application Data...</p>
    </div>
{:else}
    {#if $userRole === 'Admin'}
        <div class="container">
            <Sidebar />
            <div class="main-container">
                <UserProfile />
                <div class="dash-controls">
                    <div class="task-card">
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
                        <span class="empTxt">Pending Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Pending")}>
                            {#if activeModal === 'Pending'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.pendingCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Pending'}
                            <div class="overlay-top">
                                {#if $taskCounts.pendingTasks.length > 0}
                                    {#each $taskCounts.pendingTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #FF7518;"><b>No Pending Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <span class="empTxt">In Progress Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("inProgress")}>
                            {#if activeModal === 'inProgress'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.inProgressCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'inProgress'}
                            <div class="overlay-top">
                                {#if $taskCounts.inProgressTasks.length > 0}
                                    {#each $taskCounts.inProgressTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #1434A4;"><b>No In Progress Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <span class="empTxt">Completed Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Completed")}>
                            {#if activeModal === 'Completed'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.completedCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Completed'}
                            <div class="overlay-top">
                                {#if $taskCounts.completedTasks.length > 0}
                                    {#each $taskCounts.completedTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #00A36C;"><b>No Completed Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <span class="empTxt">Archived Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Archived")}>
                            {#if activeModal === 'Archived'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.archivedCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Archived'}
                            <div class="overlay-bottom">
                                {#if $taskCounts.archivedTasks.length > 0}
                                    {#each $taskCounts.archivedTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #175E88"><b>No Archived Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <span class="empTxt">Cancelled Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Cancelled")}>
                            {#if activeModal === 'Cancelled'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.cancelledCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Cancelled'}
                            <div class="overlay-bottom">
                                {#if $taskCounts.cancelledTasks.length > 0}
                                    {#each $taskCounts.cancelledTasks as task, index (task.id)}
                                        <p>{index + 1}. {task.title}</p>
                                    {/each}
                                {:else}
                                    <p style="color: #E34234"><b>No Cancelled Tasks!</b></p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div class="task-card-emp">
                        <span class="empTxt">Overdue Tasks</span>
                        <button class="add-btn-emp" on:click={() => toggleModal("Overdue")}>
                            {#if activeModal === 'Overdue'}
                                <span class="x-icon">❌</span>
                            {:else}
                                {$taskCounts.overdueCount ?? 0}
                            {/if}
                        </button>
                        {#if activeModal === 'Overdue'}
                            <div class="overlay-bottom">
                                {#if $taskCounts.overdueTasks.length > 0}
                                    {#each $taskCounts.overdueTasks as task, index (task.id)}
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