<script lang="ts">
import type { TaskData } from "$lib/stores/task";
import { onMount } from "svelte";
import { userRole, user, type User } from "$lib/stores/user";
import { derived, get } from "svelte/store";
import { createTask, deleteTask, fetchEmployees, refreshTasks, fetchTasks, tasks, updateTask } from "$lib/api/taskService";

let errorMessage = '';
let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
// let allTasks: Record<string, TaskData[]> = {}; 

export let showForm: boolean = false;
export const openTaskForm: boolean = false;
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

let formattedEndDate = formatDateToInput(taskData.endDate);
$: formattedEndDate = formatDateToInput(taskData.endDate);
let formattedStartDate = formatDateToInput(taskData.startDate);
$: formattedStartDate = formatDateToInput(taskData.startDate);

$: currentUser = get(user);

const closeForm = () => {
    editId = null;  
    showForm = false;
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
};

onMount(async () => {
    if(currentUser){
        await fetchTasks(
            currentUser?.id ?? 0, 
            currentUser?.role ?? '', 
            currentUser?.office ?? ''
        );

        if (currentUser?.role === 'Manager') {
            try {
                employeesInOffice = await fetchEmployees(currentUser?.office ?? '');
            } catch (error) {
                console.error("Failed to fetch employees:", error);
                errorMessage = "Error fetching employees.";
            }
        }
    } 
});

function formatDateToInput(dateString: string){
        if(!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
    }

function handleDateInput(event: Event, key: keyof TaskData) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    
    const selectedDate = target.value;
    const localDate = new Date(selectedDate);

    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());

    (taskData as Record<string, any>)[key] = new Date(selectedDate + "T00:00:00.000Z").toISOString();
}

async function handleSubmit() {
    if(!taskData.title || !taskData.description || !taskData.startDate || !taskData.endDate || !taskData.status){
        alert("Title, Description, Start and End Date, Status are Required!");
        return;
    } else {
        try {
            if(editId) {
                await updateTask(editId, taskData);
                alert("Task Updated Successfully!");
            } else {
                await createTask(taskData);
                alert("Task Created Successfully!");
            } 
        } catch (error) {
            console.error("Task creation error:", error);
            alert("An error occured!");
        } finally {
            await refreshTasks();
            closeForm();
            editId = null;
            showForm = false;
        }
    }
}
</script>
{#if $userRole === 'Manager' || $userRole === 'Employee'}
    {#if showForm}
    <div class="overlay">
        <div class="form-container">
            <button class="close-btn" on:click={closeForm}>&times;</button>
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
                        <input type="date" bind:value={formattedStartDate} on:input={(e) => handleDateInput(e, "startDate")} required />
                    </div>

                    <div class="form-group">
                        <label for="end-date">End Date</label>
                        <input type="date" bind:value={formattedEndDate} on:input={(e) => handleDateInput(e, "endDate")} required />
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
                            <select bind:value={taskData.assignedTo}    >
                                <option value={$user?.id} selected>Select Employee: (Optional)</option>
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
    {/if}
{/if}
<style>
    @media screen and (max-width: 500px) and (min-width: 300px) {
        .overlay {
            margin: auto;
            padding: 0;
            width: 100%;
        }    
        .form-container {
            margin: 0;
            margin-right: 8px;
            width: 82%;
        }
    }
    
</style>