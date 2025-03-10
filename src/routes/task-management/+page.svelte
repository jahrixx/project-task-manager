<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks } from "$lib/api/taskService";
    import { goto } from "$app/navigation";
    import { isAuthenticated, user, type User } from "$lib/stores/user";
    import { onMount } from "svelte";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import { derived, get } from "svelte/store";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let errorMessage = '';
    let successMessage = '';
    let taskData: TaskData = {
        id: null,
        title: '',
        description: '',
        startDate: null,
        endDate: null,
        status: 'Pending',
        assignedTo: null,
        createdBy: get(user)?.id ?? null,
    };

    onMount(async () => {
        if (!get(isAuthenticated)) {
            goto('/login');
            return;
        }

        const currentUser = get(user);
        if(currentUser){
            await fetchTasks(
                        currentUser?.id ?? 0, 
                        currentUser?.role ?? '', 
                        currentUser?.office ?? ''
                    );

            if (currentUser?.role === 'Manager') {
                taskData.createdBy = currentUser?.id ?? null;
                
                try {
                    employeesInOffice = await fetchEmployees(currentUser?.office ?? '');
                } catch (error) {
                    console.error("Failed to fetch employees:", error);
                    errorMessage = "Error fetching employees.";
                }
            }
        }
    });

    async function handleSubmit() {
        errorMessage = '';
        successMessage = '';

        try {
            await createTask(taskData);
            successMessage = 'Task Created Successfully!';

            const currentUser = get(user);
            await fetchTasks(
                    currentUser?.id ?? 0, 
                    currentUser?.role ?? '', 
                    currentUser?.office ?? ''
                );

            clearForm();
        } catch (error) {
            console.error("Task creation error:", error);
            errorMessage = 'An unexpected error occurred!';
        }
    }

    async function removeTask(taskId: number | null) {
        console.log("Remove task clicked:", taskId);

        if(!taskId) {
            console.error("Cannot delete task id: ID is undefined");
            return;
        }

        if(!confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            await deleteTask(taskId);
            successMessage = "Task deleted successfully";
            
            const currentUser = get(user);
            await fetchTasks(
                    currentUser?.id ?? 0, 
                    currentUser?.role ?? '', 
                    currentUser?.office ?? ''
                );

        } catch (error) {
            console.error("Error deleting task :", error);
            errorMessage = "Failed to delete task. Please try again later!";
        }
    }

    function clearForm(){
        taskData = {
            id: null,
            title: '',
            description: '',
            startDate: null,
            endDate: null,
            status: 'Pending',
            assignedTo: null,
            createdBy: get(user)?.id || null,
        };
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    }
</script>

<title>Task Management</title>

{#if !$isAuthenticated}
    <Login />
{:else}
    {#if errorMessage}
        <p style="color: red; text-align: center;">{errorMessage}</p>
    {/if}
    {#if successMessage}
        <p style="color: green; text-align: center;">{successMessage}</p>
    {/if}

    <div class="container">
        <Sidebar />
        <div class="main-container">
            <UserProfile />

            {#if $userRole === 'Admin'}
                <div class="h1">
                    <h1>Welcome to Task Management!</h1>
                    <p>Task Viewing Only for Admin Task Management!</p>    
                </div>
            {/if}

            {#if $userRole === 'Manager' || $userRole === 'Employee'}
                <div class="form-container">
                    <form on:submit|preventDefault={handleSubmit}>
                        <div class="form-group">
                            <label for="title">Title</label>
                            <input bind:value={taskData.title} type="text" placeholder="Enter Title" required />    
                        </div>

                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea bind:value={taskData.description} placeholder="Enter text here..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label for="start-date">Start Date</label>
                            <input bind:value={taskData.startDate} type="date" required />    
                        </div>

                        <div class="form-group">
                            <label for="end-date">End Date</label>
                            <input bind:value={taskData.endDate} type="date" required />    
                        </div>

                        <div class="form-group">
                            <label for="status">Status</label>
                            <select bind:value={taskData.status} required>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>    
                        </div>

                        {#if $userRole === 'Manager'}
                            <div class="form-group">
                                <label for="assigned-to">Assign To Employee</label>
                                <select bind:value={taskData.assignedTo}>
                                    <option value="" disabled selected>Select Employee</option>
                                    {#each employeesInOffice as employee}
                                        <option value={employee.id}>
                                            {employee.name} ({employee.role} - {employee.office})
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        {/if}

                        <button type="submit">Create Task</button>
                        <button type="button" on:click={clearForm}>Clear Form</button>
                    </form>
                </div>
            {/if}
        </div>
        <div class="task-view">
            {#if $userRole === 'Employee'}
                <h2>Personal Tasks</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $tasks as task}
                            <tr>
                                <td>
                                    <b>{task.title}</b><br>
                                    <span><p>{task.description}</p></span>
                                </td>
                                <td>{task.status}</td>
                                <!-- <td>{getTaskStatus(task.status, task.endDate)}</td> -->
                                <td>{formatDate(task.endDate)}</td>
                                <td>
                                    <button>Update</button>
                                    <button on:click={() => removeTask(task.id)}>Delete</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
            {#if $userRole === 'Manager'}
                <h2>All Tasks</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $tasks as task}
                            <tr>
                                <td>
                                    <b>{task.title}</b><br>
                                    <span><p>{task.description}</p></span>
                                </td>
                                <td>{task.status}</td>
                                <!-- <td>{getTaskStatus(task.status, task.endDate)}</td> -->
                                <td>{formatDate(task.endDate)}</td>
                                <td>
                                    <button>Update</button>
                                    <button on:click={() => removeTask(task.id)}>Delete</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>
{/if}

<style>
    .h1 {
        margin-left: 50px;
    }

    .main-container {
        margin-left: 250px;
    }

    .task-view {
        margin-left: 250px;
        margin-top: 20px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    table th, table td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
    }

    table th {
        background-color: #f4f4f4;
    }
</style>
