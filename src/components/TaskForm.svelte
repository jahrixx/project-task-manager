<script lang="ts">
    import { onMount } from "svelte";
    import { tasks, type TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, updateTask } from "$lib/api/taskService";
    import { get } from "svelte/store";
    import { isAuthenticated, userRole, user } from "$lib/stores/user";
    
    let editId: any = null;
    let showForm = false;
    let errorMessage = '';
    let showAlert = false;
    let alertMessage = '';

    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let taskData: TaskData = {
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

    onMount(async () => {
        if (!get(isAuthenticated)) return;

        const currentUser = get(user);
        if (currentUser) {
            await fetchTasks(currentUser.id ?? 0, currentUser.role ?? '', currentUser.office ?? '');

            if (currentUser.role === 'Manager') {
                try {
                    employeesInOffice = await fetchEmployees(currentUser.office ?? '');
                } catch (error) {
                    console.error("Failed to fetch employees:", error);
                    errorMessage = "Error fetching employees.";
                }
            }
        }
    });

    async function handleSubmit() {
        if (!taskData.title || !taskData.description || !taskData.startDate || !taskData.endDate || !taskData.status) {
            alertMessage = "Title, Description, Start and End Date, and Status are required!";
            showAlert = true;
            return;
        }

        try {
            if (editId) {
                await updateTask(editId, taskData);
                alertMessage = "Task Updated Successfully!";
            } else {
                await createTask(taskData);
                alertMessage = "Task Created Successfully!";
            }

            const currentUser = get(user);
            await fetchTasks(currentUser?.id ?? 0, currentUser?.role ?? '', currentUser?.office ?? '');

            editId = null;
            showAlert = true;
        } catch (error) {
            console.error("Task creation error:", error);
            alertMessage = "An error occurred!";
            showAlert = true;
        }
    }

    function closeAlert() {
        showAlert = false;
        showForm = false;
        clearForm();
    }

    function clearForm() {
        taskData = {
            id: null,
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Pending',
            assignedTo: null,
            createdBy: get(user)?.id || null,
            assignedToName: null,
            createdByName: null
        };
    }
</script>

<head>
    <link rel="stylesheet" href="src/components/assets/css/task-management.css">
</head>

    <div class="overlay">
        <div class="form-container">
            <h3 class="header-title">{editId ? "Update" : "Create"} Task</h3>
            <div class="form-inputs">
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
                                <option value="" disabled selected>Select Employee: (Optional)</option>
                                {#each employeesInOffice as employee}
                                    <option value={employee.id}>
                                        {employee.name} ({employee.role} - {employee.office})
                                    </option>
                                {/each}
                            </select>
                        </div>
                    {/if}

                    <div class="form-btns">
                        <button type="submit">{editId ? "Update" : "Create"} Task</button>
                    </div>
                </form>
            </div>
        </div>
    </div>                    


{#if showAlert}
    <div class="alert-overlay">
        <div class="alert-box">
            <p>{alertMessage}</p>
            <button on:click={closeAlert}>OK</button>
        </div>
    </div>
{/if}