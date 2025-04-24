<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { fetchTasks, fetchEmployees } from "$lib/api/taskService";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/user";
    import { get } from "svelte/store";
    import { tasks } from "$lib/api/taskService";
    import { getOffices } from "$lib/api/userService";

    $: currentUser = get(user);

    $: filteredCurrentTasks = $tasks.filter(task => ['Pending', 'In Progress', 'Overdue'].includes(task.status) && !task.isArchived);

    $: statusFilteredTasks = Object.fromEntries(
        Object.entries(filteredTasks ?? {}).map(([office, tasks]) => [
            office, 
            tasks.filter(task => 
                ['Pending', 'In Progress', 'Overdue'].includes(task.status)
            )
        ])
    );

    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let allTasks: Record<string, TaskData[]> = {}; 
    let filteredTasks: Record<string, TaskData[]> = {};
    let errorMessage = 'No Current Tasks Availble!';

    onMount(async () => {
        if(currentUser){
            const fetchedTasks = await fetchTasks(
                                            currentUser?.id ?? 0, 
                                            currentUser?.role ?? '', 
                                            currentUser?.office ?? ''
                                        );
            if (currentUser.role === "Admin") {
                allTasks = fetchedTasks 
                ? Object.fromEntries(fetchedTasks.map(group => [group.officeName, group.tasks])) : {};
                
                filteredTasks = { ...allTasks };
                
            } else {
                $tasks = fetchedTasks ? fetchedTasks.flatMap(group => group.tasks) : [];
            } 

            if (currentUser?.role === 'Manager') {
                try {
                    employeesInOffice = await fetchEmployees(currentUser?.office ?? '');
                } catch (error) {
                    console.error("Failed to fetch employees:", error);
                    errorMessage = "Error fetching employees.";
                }
            }
        }
    })

    function getStatusColor(status: any){
        switch(status.toLowerCase()) {
            case 'pending':
                return 'orange';
            case 'in progress':
                return 'blue';
            case 'completed':
                return 'green';
            case 'cancelled':
                return '#DC143C';
            case 'due today':
                return '#FF3131';
            case 'overdue':
                return 'red';
            default:
                return 'lightgray';
        }
    }
</script>

{#if currentUser?.role === 'Admin'}
    <!-- <h3>All Offices Current Tasks<hr></h3> -->
    <ul>
        {#each Object.entries(statusFilteredTasks ?? {}) as [office, tasks]}
            {#if tasks.length > 0}
                {#each tasks as task}
                    <div class="task-container">
                        <div class="status-container">
                            <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                            {task.status}
                        </div>
                        <div class="task-description">
                            <li><b>{task.title}</b> -  ({task.assignedToName}-{task.assigneeRole})</li>
                        </div>
                    </div>
                {/each}
            {:else}
                <p class="error">{errorMessage}</p>
            {/if}
        {/each}
    </ul>
{:else if currentUser?.role === 'Manager'}
    <!-- <h3>Current Tasks in {currentUser.office}<hr></h3> -->
    <ul>
        {#if filteredCurrentTasks.length > 0}
            {#each filteredCurrentTasks as task}
                <div class="task-container">
                    <div class="status-container">
                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                        {task.status}
                    </div>
                    <div class="task-description">
                        <li>{task.title}:  <b>{task.assignedToName}</b> - <b>{task.assigneeRole}</b></li>
                        <!-- <li>{task.title} -  ({task.assignedToName}-{task.assigneeRole})</li> -->
                    </div>
                </div>
            {/each}
        {:else}
            <p class="error">{errorMessage}</p>
        {/if}
    </ul>
{:else}
    <!-- <h3>Current Tasks of {currentUser?.firstName} {currentUser?.lastName}<hr></h3> -->
    <ul>
        {#if filteredCurrentTasks.length > 0}
            {#each filteredCurrentTasks as task}
                <div class="task-container">
                    <div class="status-container">
                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                        {task.status}
                    </div>
                    <div class="task-description">
                        <li><b>{task.title}</b>: <u>{task.description}</u></li>
                    </div>
                </div>
            {/each}
        {:else}
            <p class="error">{errorMessage}</p>
        {/if}
    </ul>
{/if}

<!-- {#if errorMessage}
    <p class="error">{errorMessage}</p>
{/if} -->

<style>
    .error{
        text-align: center;
        color: red;
    }

    li {
        list-style: none;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .status-circle {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        margin-right: 8px;
        margin-left: 7px;
    }

    .task-description {
        width: 100%;
        padding-top: 5px;
    }

    .task-container {
        /* border: 2px solid black; */
        /* width: 550px; */
        display: flex;
        gap: 30px;
        margin-bottom: 5px;
    }

    .status-container {
        width: 145px;
        height: 20px;
        padding: 3px 5px;
        display: flex;
        align-items: center;
        border: 2px solid lightgray;
        border-radius: 20px;
        font-size: 15px;
        font-weight: 500;
    }
</style>