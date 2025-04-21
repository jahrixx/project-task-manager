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
                                {#each $dashboardStats.managersList as manager}
                                    <p>{manager.name} - <i>{manager.officeName}</i></p>
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
                                {#each $dashboardStats.employeesList as employee}
                                    <p>{employee.name} - <i>{employee.officeName}</i></p>
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
                                {#each $dashboardStats.officesList as office}
                                    <p>{office.name}</p>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="activities">
                    <h2 style="margin: auto; width: 92%;">Recent Activities<hr style="height: 3px; background-color: lightgray;"></h2>
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
                        <div class="notification-list">
                            <NotificationPanel {userId}/>
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
                        <button class="add-btn-emp">{pendingCount ?? 0}</button>
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">In Progress Tasks</span>
                        <button class="add-btn-emp">{inProgressCount ?? 0}</button>
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Completed Tasks</span>
                        <button class="add-btn-emp">{completedCount ?? 0}</button>
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Archived Tasks</span>
                        <button class="add-btn-emp">{archivedCount ?? 0}</button>
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Cancelled Tasks</span>
                        <button class="add-btn-emp">{cancelledCount ?? 0}</button>
                    </div>
                    <div class="task-card-emp">
                        <!-- <span class="circle"></span> -->
                        <span class="empTxt">Overdue Tasks</span>
                        <button class="add-btn-emp">{overdueCount ?? 0}</button>
                    </div>
                </div>
                <div class="activities">
                    <h2 style="margin: auto; width: 92%;">Recent Activities<hr style="height: 3px; background-color: lightgray;"></h2>
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
                            <NotificationPanel {userId}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{/if}
