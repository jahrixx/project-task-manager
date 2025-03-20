<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { user, type User } from "$lib/stores/user";
    import { derived, get } from "svelte/store";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks, refreshTasks } from "$lib/api/taskService";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    export const managerTasks: TaskData[] = [];
    export const employeeTasks: TaskData[] = [];
    export const allTasks: Record<string, TaskData[]> = {}; 
    export let filteredManagerTasks: any;
    export let filteredEmployeeTasks: any;
    export let currentView = 'own';  

    let errorMessage = '';
    export let showForm: boolean = false;
    export let editId: any = null;
        export let taskData: TaskData = {
        id: null,
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Pending',
        assignedTo: null,
        createdBy: get(user)?.id ?? null,
        assignedToName: null,
        createdByName: null
    };
    
    function setView(view: 'own' | 'employee'){
        currentView = view;
    }

    function editTask(task: TaskData) {
        taskData = { 
            id: task.id || null,
            title: task.title || "", 
            description: task.description || "", 
            status: task.status || "",
            startDate: task.startDate ? task.startDate.split("T")[0] : "", 
            endDate: task.endDate ? task.endDate.split("T")[0] : "",
            assignedTo: task.assignedTo || null,
            createdBy: task.createdBy || null,
            assignedToName: task.assignedToName || null,
            createdByName: task.createdByName || null
        };
        editId = task.id;
        showForm = true;
    }

    async function removeTask(taskId: number | null) {
        if(!taskId) {
            console.error("Cannot delete task id: ID is undefined");
            return;
        } else if(!confirm("Are you sure you want to delete this task?")) {
            return;
        } 
            try {
                await deleteTask(taskId);
                alert("Task deleted successfully");
                await refreshTasks();
            } catch (error) {
                console.error("Error deleting task :", error);
                errorMessage = "Failed to delete task. Please try again later!";
            }
    }

    function isOverdue(task: TaskData) {
        let className = "";
        
        if (task.status === "Completed") {
            className = "text-green-500";
        } else if (task.status === "Overdue" || new Date(task.endDate) < new Date()) {
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
                return 'red';
            case 'overdue':
                return 'red';
            default:
                return 'lightgray';
        }
    }
</script>

<head>
    <link rel="stylesheet" href="src/components/assets/css/task-management.css">
</head>
{#if $userRole === 'Manager'}
<div class="task-view-btns">
    <button on:click={() => setView('own')} class:active={currentView === 'own'}>Personal Tasks</button>
    <button on:click={() => setView('employee')} class:active={currentView === 'employee'}>Employees Tasks</button>
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
                        {#each filteredManagerTasks as task}
                            <tr>
                                <td>
                                    <div class="task">
                                        <b>{task.title}</b><br>
                                        {task.description}
                                        
                                        {#if task.assignedTo !== task.createdBy}
                                            <br><br><span><i><b>Task Assigned To: </b> {task.assignedToName}</i></span>
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
                                <td class="actions">
                                    <button class="btn edit" on:click={() => editTask(task)}>Update</button>
                                    <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
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
                        <!-- <th style="text-align: center;">Actions</th> -->
                    </tr>
                </thead>
                <tbody>
                    {#if filteredEmployeeTasks.length > 0}
                        {#each filteredEmployeeTasks as task}
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
{/if}
{#if $userRole === 'Employee'}
    <div class="task-view-btns">
        <button on:click={() => setView('own')} class:active={currentView === 'own'} disabled>All Tasks</button>
    </div>
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
                    {#each filteredEmployeeTasks as task}
                        <tr>
                            <td>
                                <div class="task">
                                    <b>{task.title}</b><br>
                                    {task.description}
                                    
                                    {#if task.assignedTo !== task.createdBy}
                                        <br><br><span><i><b>Task Assigned By Manager: </b> {task.createdByName}</i></span>
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
                            <td class="actions">
                                <button class="btn edit" on:click={() => editTask(task)}>Update</button>
                                <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
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
