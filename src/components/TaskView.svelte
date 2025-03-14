<script lang="ts">
    import { tasks, type TaskData } from "$lib/stores/task";
    import { isAuthenticated, userRole, user, type User } from "$lib/stores/user";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, updateTask } from "$lib/api/taskService";
    import { derived, get } from "svelte/store";
    import { onMount } from "svelte";
    
    let currentView = 'own'; 
    let errorMessage = '';
    let successMessage = '';
    let editId: any = null;
    let showForm = false;

    let managerTasks: TaskData[] = [];
    let employeeTasks: TaskData[] = [];
    let allTasks: Record<string, TaskData[]> = {}; 
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

    $ : if ($tasks && get(user) && Array.isArray($tasks)){
            const currentUser = get(user);
        
        if(currentUser?.role === "Manager"){
            managerTasks = $tasks.filter(task => task.createdBy === currentUser.id || task.assignedTo === currentUser.id);
            employeeTasks = $tasks.filter(task => task.createdBy !== currentUser.id);
            // employeeTasks = $tasks.filter(task => task.assignedTo !== currentUser.id);
        } else {
            employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
        }
    }

    onMount(async () => {
        if (!get(isAuthenticated)) {
            // goto('/login');
            return;
        }

        const currentUser = get(user);
            if(currentUser){
                const fetchedTasks = await fetchTasks(
                                                currentUser?.id ?? 0, 
                                                currentUser?.role ?? '', 
                                                currentUser?.office ?? ''
                                            );
                if (currentUser.role === "Admin") {
                    allTasks = fetchedTasks 
                    ? Object.fromEntries(fetchedTasks.map(group => [group.officeName, group.tasks])) : {};                    
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
    });
    
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

    async function removeTask(taskId: number | null) {
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
{#if $userRole === 'Admin'}
    {#each Object.entries(allTasks ?? {}) as [office, tasks], index}
        <div class="office-name" class:first-office={index === 0}>
            <h3>{office}</h3>
        </div>
        <div class="task-holder">
            {#each tasks as task}
                <div class="task-card">
                    <div class="task-header">{task.title}</div>
                    <!-- <p>{task.description}</p> -->
                    <p>Assigned To: <strong>{task.assignedToName}</strong></p>
                    <span class="task-status {task.status.toLowerCase()}"><p>{task.status}</p></span>
                </div>
            {/each}
        </div>
    {/each}
{/if}
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
                        <!-- <th style="text-align: center;">Actions</th> -->
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
                                <!-- <td class="actions">
                                    <button class="btn edit">Update</button>
                                    <button class="btn delete" on:click={() => removeTask(task.id)}>Delete</button>
                                </td> -->
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