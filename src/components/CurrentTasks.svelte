<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { fetchTasks, fetchEmployees } from "$lib/api/taskService";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/user";
    import { get } from "svelte/store";
    import { tasks } from "$lib/api/taskService";

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
    let expandedTasks: Record<string, boolean> = {};
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

    function toggleExpand(taskId: number | null | undefined) {
        if(taskId == null) return;

        expandedTasks = {
            ...expandedTasks,
            [taskId]: !expandedTasks[taskId]
        };
    }
</script>
<link rel="stylesheet" href="src/components/assets/css/current-tasks.css">
{#if currentUser?.role === 'Admin'}
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
                            <li><b>{task.title} - <i>({task.assignedToName}-{task.assigneeRole})</i></b></li>
                        </div>
                    </div>
                {/each}
            {/if}
            {:else}
                <p class="error">{errorMessage}</p>
        {/each}
    </ul>
{:else if currentUser?.role === 'Manager'}
    <ul>
        {#if filteredCurrentTasks.length > 0}
            {#each filteredCurrentTasks as task}
                <div class="task-container">
                    <div class="status-container">
                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                        {task.status}
                    </div>
                    <div class="task-description">
                        <li><b>{task.title} - <i>({task.assignedToName}-{task.assigneeRole})</i></b></li>
                    </div>
                </div>
            {/each}
        {:else}
            <p class="error">{errorMessage}</p>
        {/if}
    </ul>
{:else}
    <ul>
        {#if filteredCurrentTasks.length > 0}
            {#each filteredCurrentTasks as task (task.id)}
                <div class="task-container">
                    <div class="status-container">
                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                        {task.status}
                    </div>
                    <div class="task-description">
                        <li>
                            <b>{task.title}</b>:           
                            {#if task.id != null}
                                <i class="description-text">
                                    <button class="text-button {expandedTasks[task.id] ? 'expanded' : ''}" on:click={() => toggleExpand(task.id)}>
                                        {task.description}
                                    </button>
                                </i>
                            {/if}     
                        </li>
                    </div>
                </div>
            {/each}
        {:else}
            <p class="error">{errorMessage}</p>
        {/if}
    </ul>
{/if}
<style>
    @media screen and (max-width: 500px) and (min-width: 300px) {
        .status-container {
            width: 120px;
            height: 10px;
            padding: 3px;
            font-size: 10px;
            margin-top: 8px;
        }
        .status-circle {
            width: 10px;
            height: 10px;
            margin-left: 5px;
        }
    }
    
    @media screen and (max-width: 320px) {
        
    }
</style>