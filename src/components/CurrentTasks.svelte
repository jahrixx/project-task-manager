<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { fetchTasks, fetchEmployees } from "$lib/api/taskService";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/user";
    import { get } from "svelte/store";
    import { tasks } from "$lib/api/taskService";

    $: currentUser = get(user);

    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let allTasks: Record<string, TaskData[]> = {}; 
    let filteredTasks: Record<string, TaskData[]> = {};
    let errorMessage = '';

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
</script>

{#if currentUser?.role === 'Admin'}
    <!-- <h3>All Offices Current Tasks<hr></h3> -->
    <ul>
        {#each Object.entries(filteredTasks ?? {}) as [office, tasks]}
            {#each tasks as task}
                <li>{task.title} - {task.status} ({task.assignedToName}-{task.assigneeRole})</li>
            {/each}
        {/each}
    </ul>
{:else if currentUser?.role === 'Manager'}
    <!-- <h3>Current Tasks in {currentUser.office}<hr></h3> -->
    <ul>
        {#each $tasks as task}
            <li>{task.status} - {task.title}:  <b>{task.assignedToName}</b> - <b>{task.assigneeRole}</b></li>
        {/each}
    </ul>
{:else}
    <!-- <h3>Current Tasks of {currentUser?.firstName} {currentUser?.lastName}<hr></h3> -->
    <ul>
        {#each $tasks as task}
            <li>{task.status} - <b>{task.title}</b>: <u>{task.description}</u></li>
        {/each}
    </ul>
{/if}

{#if errorMessage}
    <p class="error">{errorMessage}</p>
{/if}
