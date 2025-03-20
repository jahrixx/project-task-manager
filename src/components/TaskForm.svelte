<script lang="ts">
import type { TaskData } from "$lib/stores/task";
import { onMount } from "svelte";
import { userRole, user, type User } from "$lib/stores/user";
import { derived, get } from "svelte/store";
import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks, updateTask } from "$lib/api/taskService";
    import { getRequest } from "@sveltejs/kit/node";

export let showForm: boolean = false;
export let editId: any = null;
let errorMessage = '';

let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
let allTasks: Record<string, TaskData[]> = {}; 

$: currentUser = get(user);

export let taskData: TaskData = {
    id: null,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Pending',
    assignedTo: null,
    createdBy: currentUser && currentUser.id !== undefined ? currentUser.id : null,
    assignedToName: null,
    createdByName: null
};

let formattedEndDate = formatDateToInput(taskData.endDate);
$: formattedEndDate = formatDateToInput(taskData.endDate);
let formattedStartDate = formatDateToInput(taskData.startDate);
$: formattedStartDate = formatDateToInput(taskData.startDate);

onMount(async () => {
    const currentUser = get(user);
    if(!currentUser) return;
    
    taskData.createdBy = currentUser.id ?? null;
    taskData.createdByName = `${currentUser.firstName} ${currentUser.lastName}`;

    if(currentUser.role === 'Employee'){
        taskData.assignedTo = currentUser.id ?? null;
        taskData.assignedToName = `${currentUser.firstName} ${currentUser.lastName}`;
    }

    if (currentUser.role === 'Manager') {
        try {
            employeesInOffice = await fetchEmployees(currentUser.office ?? '');
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            errorMessage = "Error fetching employees.";
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
        createdBy: currentUser?.id || null,
        assignedToName: null,
        createdByName: null
    };
    formattedStartDate = "";
    formattedEndDate = "";
};

async function handleSubmit() {
    console.log("task data before submission: ", taskData);
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

async function refreshTasks() {
    const currentUser = get(user);
    if(!currentUser){
        return;
    }

    const fetchedTasks = await fetchTasks(
            currentUser?.id ?? 0, 
            currentUser?.role ?? '', 
            currentUser?.office ?? ''
        );
        console.log("Fetched tasks after execution:", fetchedTasks);

    if (currentUser?.role === "Admin") {
        allTasks = fetchedTasks
            ? Object.fromEntries(fetchedTasks.map(group => [group.officeName, group.tasks]))
            : {};
    } else {
        $tasks = fetchedTasks ? fetchedTasks.flatMap(group => group.tasks) : [];
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
    {/if}
{/if}
