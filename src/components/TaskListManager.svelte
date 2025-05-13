<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { user, type User } from "$lib/stores/user";
    import { derived, get, writable } from "svelte/store";
    import { removeTask, refreshTasks } from "$lib/api/taskService";
    import { archiveTask as apiArchiveTasks, unarchiveTask as apiUnarchiveTasks, fetchArchivedTasks } from "$lib/api/archive";

    let managerTasks: TaskData[] = [];
    let employeeTasks: TaskData[] = [];

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");
    export const allTasks: Record<string, TaskData[]> = {}; 
    export let archivedTasks = writable<TaskData[]>([]);
    export let filteredManagerTasks: any = managerTasks;
    export let filteredEmployeeTasks: any = employeeTasks;
    export let filteredArchivedTasks: any = archivedTasks;
    export let openTaskForm;    
    export let currentView = 'own';  
    export function setView(view: 'own' | 'employee' | 'archived'){
        currentView = view;
        if(view === 'archived'){
            loadArchiveTasks();
        }
    }

    async function loadArchiveTasks() {
        try {
            const fetchedTasks = await fetchArchivedTasks();
            const currentUser = get(user);

            let filteredArchived = Array.isArray(fetchedTasks) ? fetchedTasks : [];

            filteredArchived = filteredArchived.filter((task: TaskData) => {
            if(currentUser?.role === 'Employee'){
                    return task.assignedTo === currentUser?.id || task.createdBy === currentUser?.id; 
                } else if (currentUser?.role === 'Manager') {
                    return task.assignedTo === currentUser?.id ||
                            task.createdBy === currentUser?.id ||
                            task.office === currentUser?.office;
                }
                return true;
            });

            return $archivedTasks = filteredArchived;
        } catch (error) {
            console.error('Error loading archived tasks!', error);
            return archivedTasks;
        }
    }

    async function archiveTask(taskId:number) {
        try {
            await apiArchiveTasks(taskId);
            await refreshTasks();
            await loadArchiveTasks();
        } catch (error) {
            console.error('Error archiving task: ', error);
            
        }
    }

    async function unarchiveTask(taskId:number) {
        try {
            await apiUnarchiveTasks(taskId);
            await refreshTasks();
            await loadArchiveTasks();
        } catch (error) {
            console.error('Error archiving task: ', error);
        }
    }

    $: currentUser = get(user);

    function isOverdue(task: TaskData) {
        let className = "";
        
        if (task.status === "Completed") {
            className = "text-green-500";
        } else if (task.status === "Overdue") {
            className = "text-red-500";
        } else if (task.status === "Pending"){
            className = "text-black-500";
        } else if (task.status === "In Progress") {
            className = "text-black-500";
        } else if (task.status === "Cancelled") {
            className = "text-red-500";
        }
        return className;
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        return date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "2-digit",
                year: "numeric",
            });
    }

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

{#if $userRole === 'Manager'}
<div class="task-view-btns">
    <button on:click={() => setView('own')} class:active={currentView === 'own'}>Personal Tasks</button>
    <button on:click={() => setView('employee')} class:active={currentView === 'employee'}>Employees Tasks</button>
    <button on:click={() => setView('archived')} class:active={currentView === 'archived'}>Archived Tasks</button>
</div>
    {#if currentView === 'own'}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#if filteredManagerTasks.length > 0}
                        {#each filteredManagerTasks as task (task.id)}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}
                                        
                                        {#if task.assignedTo !== task.createdBy}
                                            <br><br><span><i><b>Task Assigned To: </b> {task.assignedToName}</i></span>
                                        {:else}
                                            <br><br><span><i><b>Personal Task By: </b> {task.createdByName}</i></span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td>
                                    <span class="{isOverdue(task)}">{formatDate(task.endDate)}</span>
                                </td>
                                <td class="actions">
                                    <button class="btn edit" on:click={() => openTaskForm(task)}>Update</button>
                                    <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
                                    <button class="btn archive" on:click={() => archiveTask(task.id)}>Archive</button>
                                </td>
                            </tr>
                        {/each}
                        {:else}
                            <tr>
                                <td colspan="4" style="padding-top: 30px; text-align: center; color: red;">No Personal Tasks Found!</td>
                            </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
    {#if currentView === 'employee'}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    {#if filteredEmployeeTasks.length > 0}
                        {#each filteredEmployeeTasks as task (task.id)}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}

                                        {#if task.createdBy === task.createdBy}
                                            <br><br><span><i><b>Task Created By Employee: </b> {task.createdByName}</i></span>
                                        {:else}
                                            <span></span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td>
                                    <span class="{isOverdue(task)}">{formatDate(task.endDate)}</span>
                                </td>
                            </tr>
                        {/each}
                        {:else}
                            <tr>
                                <td colspan="4" style="padding-top: 30px; text-align: center; color: red;">No Employees Task Found!</td>
                            </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
    {#if currentView === 'archived'}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#if filteredArchivedTasks.length > 0}
                        {#each filteredArchivedTasks as task (task.id)}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}
                                        
                                        {#if task.assignedTo !== task.createdBy}
                                            <br><br><span><i><b>Task Assigned To Employee: </b> {task.assignedToName}</i></span>
                                            <br><span><i><b>Task Created By Manager: </b> {task.createdByName}</i></span>
                                        {:else if task.assignedTo === task.createdBy && task.createdBy !== currentUser?.id}
                                            <br><br><span><i><b>Task Created By Employee: </b> {task.createdByName}</i></span>
                                        {:else}
                                            <br><br><span><i><b>Task Created By Manager: </b> {task.createdByName}</i></span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td>
                                    <span class="{isOverdue(task)}">{formatDate(task.endDate)}</span>
                                </td>
                                <td class="actions">
                                    <button class="btn archive" on:click={() => task.id != null && unarchiveTask(task.id)}>Unarchive</button>
                                </td>
                            </tr>
                        {/each}
                        {:else}
                            <tr>
                                <td colspan="4" style="padding-top: 30px; text-align: center; color: red;">No Archive Tasks Found!</td>
                            </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
{/if}
{#if $userRole === 'Employee'}
    <div class="task-view-btns">
        <button on:click={() => setView('own')} class:active={currentView === 'own'}>All Tasks</button>
        <button on:click={() => setView('archived')} class:active={currentView === 'archived'}>Archived Tasks</button>
    </div>
    {#if currentView === 'own'}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#if filteredEmployeeTasks.length > 0}
                        {#each filteredEmployeeTasks as task (task.id)}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}
                                        
                                        {#if task.assignedTo !== task.createdBy}
                                            <br><br><span><i><b>Task Assigned By Manager: </b> {task.createdByName}</i></span>
                                        {:else}
                                            <br><br><span><i><b>Personal Task Created By: </b> {task.createdByName}</i></span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td>
                                    <span class="{isOverdue(task)}">{formatDate(task.endDate)}</span>
                                </td>
                                <td class="actions">
                                    <button class="btn edit" on:click={() => openTaskForm(task)}>Update</button>
                                    <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
                                    <button class="btn archive" on:click={() => archiveTask(task.id)}>Archive</button>
                                </td>
                            </tr>
                        {/each}
                        {:else}
                            <tr>
                                <td colspan="4" style="padding-top: 30px; text-align: center; color: red;">No Tasks Found!</td>
                            </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
    {#if currentView === 'archived'}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#if filteredArchivedTasks.length > 0}
                        {#each filteredArchivedTasks as task (task.id)}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}
                                        
                                        {#if task.assignedTo !== task.createdBy}
                                            <br><br><span><i><b>Task Assigned By Manager: </b> {task.createdByName}</i></span>
                                        {:else}
                                            <br><br><span><i><b>Personal Task Created By: </b> {task.createdByName}</i></span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <div class="status-container">
                                        <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td>
                                    <span class="{isOverdue(task)}">{formatDate(task.endDate)}</span>
                                </td>
                                <td class="actions">
                                    <button class="btn archive" on:click={() => task.id != null && unarchiveTask(task.id)}>Unarchive</button>
                                </td>
                            </tr>
                        {/each}
                        {:else}
                            <tr>
                                <td colspan="4" style="padding-top: 30px; text-align: center; color: red;">No Archive Tasks Found!</td>
                            </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
{/if}