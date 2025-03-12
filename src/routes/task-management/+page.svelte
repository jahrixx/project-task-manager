<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks, updateTask } from "$lib/api/taskService";
    import { goto } from "$app/navigation";
    import { isAuthenticated, user, type User } from "$lib/stores/user";
    import { onMount } from "svelte";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import { derived, get } from "svelte/store";
    import { redirect } from "@sveltejs/kit";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    let managerTasks: TaskData[] = [];
    let employeeTasks: TaskData[] = [];
    let currentView = 'own';    

    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let errorMessage = '';
    let successMessage = '';
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

    $ : if ($tasks && get(user)){
        const currentUser = get(user);
        if(currentUser?.role === "Manager"){
            managerTasks = $tasks.filter(task => task.createdBy === currentUser.id && task.assignedTo === currentUser.id);
            employeeTasks = $tasks.filter(task => task.assignedTo !== currentUser.id);
        } else {
            employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
        }
    }

    let editId: any = null;
    let showForm = false;
    let showFilters = false;

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
                try {
                    employeesInOffice = await fetchEmployees(currentUser?.office ?? '');
                } catch (error) {
                    console.error("Failed to fetch employees:", error);
                    errorMessage = "Error fetching employees.";
                }
            }
        }
    });

    //new
    async function handleSubmit() {
        if(!taskData.title || !taskData.description || !taskData.startDate || !taskData.endDate || !taskData.status){
            alert("Title, Description, Start and End Date, Status are Required!");
            return;
        }

        try {
            if(editId) {
                await updateTask(editId, taskData);
                alert("Task Updated Successfully!");
            } else {
                await createTask(taskData);
                alert("Task Created Successfully!");
            }

            const currentUser = get(user);
                await fetchTasks(
                    currentUser?.id ?? 0, 
                    currentUser?.role ?? '', 
                    currentUser?.office ?? ''
                );

            clearForm();
            editId = null;
            showForm = false;
        } catch (error) {
            console.error("Task creation error:", error);
            alert("An error occured!");
        }
    }

    //new 
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

    function isOverdue(endDate: string, status: string) {   
        const dueDate = new Date(endDate);
        const today = new Date();

        if(!endDate){
            return false;
        } else if (status === 'Completed'){
            return 'green'
        } else {
            return dueDate < today;
        }
    }

    function setView(view: 'own' | 'employee'){
        currentView = view;
    }

    function toggleFilter(){
        showFilters = !showFilters;
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
            <div class="header">
                <div class="control-btn">
                    {#if $userRole === 'Admin'}
                        <button class="filter-btn" on:click={() => showForm = false}><img width="22" height="22" src="https://img.icons8.com/ios-filled/50/FFFFFF/filter--v1.png" alt="filter--v1"/></button>
                        <h3><u>Task Viewing</u></h3>
                    {/if}        
                    {#if $userRole === 'Manager'}
                        <button class="filter-btn" on:click={() => showForm = false}><img width="22" height="22" src="https://img.icons8.com/ios-filled/50/FFFFFF/filter--v1.png" alt="filter--v1"/></button>
                        <button class="add-btn" on:click={() => showForm = true}><img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
                    {/if}
                    {#if $userRole === 'Employee'}
                        <button class="add-btn" style="padding-bottom: 2.25px;" on:click={() => showForm = true}><img width="30" height="30" style="padding-bottom: 2.25px;" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
                    {/if}

                    {#if showFilters}
                        <div class="filter-container">
                            <div class="filter-header">Filter by Department</div>
                            <div class="checkbox-group">
                                
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="search">
                    <div class="search-input-container">
                        <input type="text" class="search-bar" placeholder="Search" on:keydown={ (e) => { if (e.key === "Enter")e.preventDefault(); }} >
                        <button class="search-icon" on:click={() => showForm = false}>🔍</button>
                        {#if showFilters}
                            <button class="reset-icon" on:click={() => showForm = false}>❌</button>
                        {/if}
                    </div>
                </div>
            </div>
      
            {#if $userRole === 'Admin'}
                <div class="h1">
                    <h1>Welcome to Task Management!</h1>
                    <p>Task Viewing Only for Admin Task Management!</p>    
                </div>
            {/if}

            {#if $userRole === 'Manager' || $userRole === 'Employee'}
            <hr>
                {#if showForm}
                    <div class="overlay">
                        <div class="form-container">
                            <button class="close-btn" on:click={clearForm}>&times;</button>
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
                                        <!-- <button type="button" on:click={clearForm}>Clear Form</button> -->
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
        <div class="task-view">
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
                                {#if managerTasks.length > 0}
                                    {#each managerTasks as task}
                                        <tr>
                                            <td>
                                                <div class="task">
                                                    <b>{task.title}</b><br>
                                                    {task.description}
                                                </div>
                                            </td>
                                            <td>
                                                <div class="status-container">
                                                    <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                                    {task.status}
                                                </div>
                                            </td>
                                            <td>
                                                <span style="color: {isOverdue(task.endDate, task.status) === 'green' ? 'green' : isOverdue(task.endDate, task.status) ? 'red' : 'black'};">{formatDate(task.endDate)}</span>
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
                                    <th style="text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if employeeTasks.length > 0}
                                    {#each employeeTasks as task}
                                        <tr>
                                            <td>
                                                <div class="task">
                                                    <b>{task.title} <i>- {task.assignedToName}</i></b><br>
                                                    {task.description}
                                                </div>
                                            </td>
                                            <td>
                                                <div class="status-container">
                                                    <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                                    {task.status}
                                                </div>
                                            </td>
                                            <td>
                                                <span style="color: {isOverdue(task.endDate, task.status) === 'green' ? 'green' : isOverdue(task.endDate, task.status) ? 'red' : 'black'};">{formatDate(task.endDate)}</span>
                                            </td>
                                            <td class="actions">
                                                <!-- <button class="btn edit">Update</button> -->
                                                <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
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
                            {#if employeeTasks.length > 0}
                                {#each employeeTasks as task}
                                    <tr>
                                        <td>
                                            <div class="task">
                                                <b>{task.title}</b><br>
                                                {task.description}
                                            </div>
                                        </td>
                                        <td>
                                            <div class="status-container">
                                                <div class="status-circle" style="background-color: {getStatusColor(task.status)};"></div>
                                                {task.status}
                                            </div>
                                        </td>
                                        <td>
                                            <span style="color: {isOverdue(task.endDate, task.status) === 'green' ? 'green' : isOverdue(task.endDate, task.status) ? 'red' : 'black'};">{formatDate(task.endDate)}</span>
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
        </div>
    </div>
{/if}

<style>
    hr {
        margin-top: 20px;
        border: 2.5px solid lightgray;
        border-radius: 3px;
        margin-left: auto;
        margin-right: auto;
    }

    .h1 {
        margin-left: 50px;
    }

    h3 {
        margin-top: 7px;
        margin-left: 5px;
        font-size: 1.4rem;
        font-weight: bold;
        font-family: Arial, Helvetica, sans-serif;
        color: #175e88;
    }

    .header-title {
        margin-bottom: 20px;
        margin-top: 0;
        font-size: 1.5rem;
        font-weight: bold;
        font-family: Arial, Helvetica, sans-serif;
        color: #175e88;
    }

    .main-container {
        margin-left: 250px;
    }

    /* Table styles */
    .task-view {
        margin-left: 250px;
        margin-top: 20px;
    }

    .task-view-btns{
        margin-left: 55px;
        display: flex;
        gap: 20px;
    }

    /* .employee-all-task p {
        color: #175e88;
        font-size: 1.1rem;
        font-family: Arial, Helvetica, sans-serif;
        text-decoration: underline;
        text-underline-offset: 5px;
    } */

    .task-view-btns button {
        background: none;
        border: none;
        color: lightgray;
        border-bottom: 2px solid lightgray;
        padding: 10px 2px 2px 0px;
        cursor: pointer;
        font-size: 1.1rem;
        transition: border-bottom 0.3 ease;
    }

    .task-view-btns button.active {
        color: #175e88;
        border-bottom: 2px solid #175e88;
    }

    .task-view-btns button:hover {
        color: #175e88;
        border-bottom: 2px solid #175e88;
    }

    .table-container {
        width: 98%;
        border-collapse: collapse;
        padding: 5px;
        margin: auto;
        overflow-y: auto;
        /* border: 1px solid black; */
    }

    table {
        width: 94.25%;
        border-collapse: collapse;
        margin: auto;
    }

    table th, table td {
        padding: 10px;
        /* border: 1px solid #ddd; */
        text-align: left;
        font-size: 14px;
        font-family: Arial, Helvetica, sans-serif;
    }

    table th {
        background-color: none;
        color: darkgray;
    }

    /* Custom column width */
    th:nth-child(1), td:nth-child(1) { width: 45%; }
    th:nth-child(2), td:nth-child(2) { width: 20%; }
    th:nth-child(3), td:nth-child(3) { width: 20%; }
    th:nth-child(4), td:nth-child(4) { width: 15%; }
    
    .actions{
        text-align: center;
    }

    .actions .btn {
        background-color: #23BEDA;
        color: white;
        border: none;
        padding: 6px;
        border-radius: 5px;
        cursor: pointer;
    }

    .actions .edit:hover {
        background-color: #175e88;
        color: white;
    }

    .actions .delete:hover {
        background-color: red;
        color: white;
    }

    /* header section */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 3rem;
        padding-right: 2rem;
        /* border-bottom: 1px solid black; */
    }

    .control-btn {
        display: flex;
        gap: 10px;
        position: relative;
    }

    /* filter button styles */
    .filter-btn {
        text-align: center;
        height: 40px;
        width: 40px;
        border: none;
        border-radius: 50%;
        background-color: #23BEDA;
        color: white;
        cursor: pointer;
        transition: background-color 0.3 ease;
    }

    .filter-btn img {
        margin: 0;
        padding-top: 5px;
        padding-left: 1px;
    }

    .filter-container {
        position: absolute;
        top: 120%;
        left: 0;
        background-color: white;
        padding: 10px;
        border-radius: 10px;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
        width: 335px;
        z-index: 10;
    }

    .filter-header {
        font-weight: bold;
        font-size: 1rem;
        margin-bottom: 10px;
    }

    .checkbox-group {
        display: flex;
        flex-wrap: wrap;
    }

    /* .checkbox-group label {
        display: flex;
        align-items: center;
        width: 50%;
        margin-bottom: 5px;
    } */

    /* Add user styles */
    .add-btn {
        display: flex;
        /* padding: 0.7rem; */
        border: none;
        border-radius: 25px;
        background-color: #23BEDA;
        color: white;
        cursor: pointer;
        transition: background-color 0.3 ease;
    }
    .add-btn img {
        margin: 0;
        padding-left: 2px;
        padding-top: 3px;
    }
    .add-btn span {
        font-size: 1rem;
        margin: 0;
        padding-left: 3px;
        padding-right: 5px;
        padding-top: 10px;
    }

    .filter-btn:hover, .add-btn:hover {
        background-color: #175e88;
    }

    /* searchbar styles */
    .search {
        flex-grow: 1;
        display: flex;
        justify-content: flex-end;
        padding-right: 1rem;
    }

    .search-input-container {
        display: flex;
        align-items: center;
        position: relative;
        width: 300px;
    }

    .search-icon, .reset-icon {
        position: absolute;
        right: 10px;
        cursor: pointer;
        font-size: 16px;
        background: none;
        border: none;
    }

    .search-icon {
        padding-top: 1px;
        right: 32.5px;
        font-size: 18px;
    }

    .search-bar {
        padding: 0.8rem;
        border: 1px solid black;
        border-radius: 5px;
        width: 350px;
        transition: border-color 0.3 ease;
        padding-left: 22.5px;
    }

    .search-bar:focus {
        outline: none;
        border-color: #23BEDA;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, .3);
    }

    /* Overlay and form styles */
    .form-btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .form-container {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        position: relative;
        width: 500px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 0.9rem;
    }

    /* Adjust label and input width */
    .form-group {
        display: flex;
        gap: 5px;
    }

    .form-group label {
        margin-left: 6px;
        padding-top: 8px;
        font-weight: bold;
        width: 30%;
        flex-shrink: 0;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }

    textarea {
        resize: none;
        height: 100px;
    }

    input[type="date"] {
        width: 100%;
    }

    .form-btns button {
        /* flex: 1; */
        padding: 10px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }

    button[type="submit"] {
        background-color: #23BEDA;
        color: white;
    }

    button[type="submit"]:hover {
        background-color: #175e88;
    }

    /* button[type="button"] {
        background-color: red;
        color: white;
    }

    button[type="button"]:hover {
        background-color: darkred;
    } */

    /* Close button */
    .close-btn {
        position: absolute;
        top: 0;
        right: 12px;
        background: none;
        border: none;
        font-size: 2.5rem;
        cursor: pointer;
        color: #175e88;
    }

    .close-btn:hover {
        color: red;
    }

    /* status color div styles */
    .status-container {
        width: 100px;
        padding: 3px 5px;
        display: flex;
        align-items: center;
        border: 2px solid lightgray;
        border-radius: 20px;
        font-size: 13px;
    }

    .status-circle {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        margin-right: 8px;
        margin-left: 5px;
    }
    
    .task{
        line-height: normal;
    }

</style>
