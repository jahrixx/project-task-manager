<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, isAuthenticated, userRole } from '$lib/stores/user';
    import { dashboardStats, fetchDashboardStats } from '$lib/api/dashboardService';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    import RecentActivities from '../../components/RecentActivities.svelte';
    import { get } from 'svelte/store';
    import { fetchActivities } from '$lib/api/activityService';

    let activeModal = '';
    let activities: any = [];
    let role = '';

    onMount(async () => {  
        if(!isAuthenticated){
            goto('/login');
            return; 
        }
        
        const currentUser = get(user);
        const userId = currentUser?.id ?? 0;
        role = currentUser?.role || '';

        try {
            const res = await fetchActivities(userId, role);
            activities = res;
            console.log("Results: ",activities);    
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
</script>

<title>Dashboard</title>
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
            </div>
        </div>            
    {/if}
    {#if $userRole === 'Manager' || $userRole === 'Employee'}
        <div class="container">
            <Sidebar />
            <div class="main-container">
                <UserProfile />
                <div class="dash-controls">
                    <div class="task-card">
                        <!-- <span class="circle"></span> -->
                        <span class="task-text">Lorem Ipsum</span>
                        <button class="add-btn">+</button>
                    </div>
                    <div class="task-card">
                        <!-- <span class="circle"></span> -->
                        <span class="task-text">Lorem Ipsum</span>
                        <button class="add-btn" on:click={() => toggleModal('Employees')}>+</button>
                    </div>
                    <div class="task-card">
                        <!-- <span class="circle"></span> -->
                        <span class="task-text">Lorem Ipsum</span>
                        <button class="add-btn">+</button>
                    </div>
                </div>
                <div class="activities">
                    <h2 style="margin: auto; width: 92%;">Recent Activities<hr style="height: 3px; background-color: lightgray;"></h2>
                    <div class="container-recent-activities" style="margin: auto; width: 90%;">
                        <RecentActivities {activities} {role}/>
                    </div>
                </div>
                <div class="current-task-and-notifications">
                    
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    .main-container {
        margin-left: 250px;
    }

    .dash-controls {
        display: flex;
        gap: 10px;
        justify-content: space-evenly;
        margin-bottom: 20px;
        margin-top: 20px;
    }

    .task-card {
        width: 318px;
        display: flex;
        align-items: center;
        gap: 20px;
        background: #23BEDA;
        color: black;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
    }

    .task-card:hover {
        background: #1CA0C3;
    }

    /* .circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: white;
        color: black;
        font-weight: bold;
        font-size: 1.5rem;
        border-radius: 50%;
    } */

    .task-text {
        margin-left: 30px;
        flex: 1;
        font-size: 1.5rem;
        color: white;
    }

    .add-btn {
        margin-right: 30px;
        background: white;
        color: #23BEDA;
        border: none;
        font-size: 1.2rem;
        font-weight: bold;
        padding: 5px 10px;
        border-radius: 50%;
        cursor: pointer;
        transition: 0.3s;
    }

    .overlay {
        background-color: #fff;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        position: absolute;
        z-index: 999;
        top: 172.5px;
        width: auto;
    }

    .overlay p {
        font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
        margin: 8px 0;
        font-size: .7rem;
    }

    .add-btn:has(span.x-icon) {
        font-size: 1rem;
        color: white;
        width: 30px;
        height: 30px;
        padding: 0;
        border-radius: 50%;
    }

    .add-btn:hover {
        background: #e0e0e0;
        transform: scale(1.1);
    }

    .add-btn:active {
        transform: scale(0.9);
    }
</style>
