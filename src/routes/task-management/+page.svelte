<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks, updateTask } from "$lib/api/taskService";
    import { goto } from "$app/navigation";
    import { isAuthenticated, user, type User } from "$lib/stores/user";
    import { onMount } from "svelte";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import TaskForm from "../../components/TaskForm.svelte";
    import { derived, get } from "svelte/store";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    let showForm = false;
    let showFilters = false;
    let editId: any = null;

    let selectedTask: any;
    let selectedOffice: any;
    let computedAssignedTo: any;
    let filteredManagerTasks: any;
    let filteredEmployeeTasks: any;
    let managerTasks: TaskData[] = [];
    let employeeTasks: TaskData[] = [];
    let selectedDepartments: any = [];
    let selectedStatuses: any = [];
    let allTasks: Record<string, TaskData[]> = {}; 
    let filteredTasks: Record<string, TaskData[]> = {};
    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    
    let errorMessage = '';
    let successMessage = '';
    let currentView = 'own';   
    let searchQuery = "";
    let currentUser;
      
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

    $: currentUser = get(user);
    $ : if ($tasks && get(user) && Array.isArray($tasks)){
            console.log("Reactive statement tasks:", $tasks);

            if(currentUser?.role === "Manager"){
                managerTasks = $tasks.filter(task => task.createdBy === currentUser.id || task.assignedTo === currentUser.id);
                filteredManagerTasks = [ ...managerTasks ];

                employeeTasks = $tasks.filter(task => task.createdBy !== currentUser.id);
                filteredEmployeeTasks = [ ...employeeTasks ];
            } else {
                employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
                filteredEmployeeTasks = [ ...employeeTasks ];
            }
    }

    onMount(async () => {
        if (!get(isAuthenticated)) {
            goto('/login');
            return;
        }

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
    });

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

    function openForm(task: TaskData | null = null) {
        if (task) {
            // Edit Mode: Prefill the form with task data
            taskData = { ...task };
            editId = task.id;
        } else {
            // Create Mode: Reset form fields
            taskData = { 
                id: null,
                title: "", 
                description: "", 
                status: "To Do",
                startDate: "", 
                endDate: "",
                assignedTo: null,
                createdBy: null,
                assignedToName: null,
                createdByName: null
            };
            editId = null;
        }
        showForm = true;
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

    function clearForm(){
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

    function setView(view: 'own' | 'employee'){
        currentView = view;
    }

    function toggleFilter(){
        showFilters = !showFilters;
    }

    function filterTasks() {
        const currentUser = get(user);
        let search = searchQuery.toLowerCase();

        switch (currentUser?.role){
            case "Admin" : 
                filteredTasks = Object.fromEntries(
                    Object.entries(allTasks ?? {}).map(([office, tasks]) => [
                        office,
                        tasks.filter(task =>
                            (task.title?.toLowerCase() ?? "").includes(search) ||
                            (task.description?.toLowerCase() ?? "").includes(search) ||
                            (task.assignedToName?.toLowerCase() ?? "").includes(search)
                        ),
                    ]).filter(([_, tasks]) => tasks.length > 0) 
                );
                break;

            case "Manager" :
                if(search){
                    filteredManagerTasks = managerTasks.filter(task =>
                        (task.title?.toLowerCase() ?? "").includes(search) ||
                        (task.description?.toLowerCase() ?? "").includes(search) ||
                        (task.assignedToName?.toLowerCase() ?? "").includes(search)
                    );

                    filteredEmployeeTasks = employeeTasks.filter(task =>
                        (task.title?.toLowerCase() ?? "").includes(search) ||
                        (task.description?.toLowerCase() ?? "").includes(search) ||
                        (task.createdByName?.toLowerCase() ?? "").includes(search)
                    );

                } else {
                    filteredManagerTasks = [ ...managerTasks ];
                    filteredEmployeeTasks = [ ...employeeTasks ];
                }
                break;

            case "Employee" : 
                filteredEmployeeTasks = employeeTasks.filter(task =>
                    (task.title?.toLowerCase() ?? "").includes(search) ||
                    (task.description?.toLowerCase() ?? "").includes(search) ||
                    (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                    (task.status?.toLowerCase() ?? "").includes(search)
                );
                break;

            default:
                filteredTasks = { ...allTasks };
        }
    }

    function filterByDept() {
        if (selectedDepartments.length === 0) {
            filteredTasks = allTasks;
            return;
        }
        filteredTasks = Object.fromEntries(
            Object.entries(allTasks).filter(([office]) => selectedDepartments.includes(office))
        );
    }

    function filterByStatus(){   
        if(selectedStatuses.length === 0){
            filteredManagerTasks = [ ...managerTasks ];
            filteredEmployeeTasks = [ ...employeeTasks ];
            return;
        }

        if (currentView === "own") {
            filteredManagerTasks = managerTasks.filter(task => selectedStatuses.includes(task.status));
        } else if (currentView === "employee") {
            filteredEmployeeTasks = employeeTasks.filter(task => selectedStatuses.includes(task.status));
        }         
    }

    function updateSelection(department: string) {
        if (selectedDepartments.includes(department)) {
            selectedDepartments = selectedDepartments.filter((dep: string) => dep !== department);
        } else {
            selectedDepartments = [...selectedDepartments, department];
        }
        filterByDept();
    }

    function updateStatusFilter(status: string){
        if(selectedStatuses.includes(status)){
            selectedStatuses = selectedStatuses.filter((s: string) => s !== status);
        } else {
            selectedStatuses = [ ...selectedStatuses, status ]
        }
        filterByStatus();
    }

    function resetSearch(){
        searchQuery = "";
        showFilters = false;

        const currentUser = get(user);
        switch (currentUser?.role) {
            case "Admin":
                filteredTasks = { ...allTasks };
                break;
            
            case "Manager":
                filteredManagerTasks = [ ...managerTasks ];
                filteredEmployeeTasks = [ ...employeeTasks ];
                break;
            
            case "Employee":
                filteredEmployeeTasks = [ ...employeeTasks ];
                break;
        
            default:
                filteredTasks = { ...allTasks };
                break;
        }
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
    function handleTaskDetails(task: any, office: any){
        selectedTask = task;
        selectedOffice = office;
        computedAssignedTo = task.createdByName === task.assignedToName ? 'N/A' : task.assignedToName;
        showForm = true;
    }
</script>

<title>Task Management</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/task-management.css">
</head>

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
                        <button class="filter-btn" on:click={toggleFilter}><img width="22" height="22" src="https://img.icons8.com/ios-filled/50/FFFFFF/filter--v1.png" alt="filter--v1"/></button>
                        {#if showFilters}
                            <div class="filter-container">
                                <div class="filter-header">Filter by Department</div>
                                <div class="checkbox-group">
                                    {#each Object.keys(allTasks ?? {}) as office}
                                        <label>
                                            <input type="checkbox" checked={selectedDepartments.includes(office)} on:change={() => updateSelection(office)} />
                                            {office}
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        <h3><u>Task Viewing</u></h3>
                    {/if}        
                    {#if $userRole === 'Manager'}
                        <button class="filter-btn" on:click={toggleFilter}><img width="22" height="22" src="https://img.icons8.com/ios-filled/50/FFFFFF/filter--v1.png" alt="filter--v1"/></button>
                        {#if showFilters}
                            <div class="filter-container" style="top: 110%;">
                                <div class="filter-header">Filter by Status</div>
                                <div class="checkbox-group">
                                    {#each Array.from(new Set([...managerTasks, ...employeeTasks].map(task => task.status))) as status}
                                        <label>
                                            <input type="checkbox" 
                                                   checked = {selectedStatuses.includes(status)}
                                                   on:change={() => updateStatusFilter(status)} />
                                            {status}
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        <button class="add-btn" on:click={() => showForm = true}><img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
                    {/if}
                    {#if $userRole === 'Employee'}
                        <button class="add-btn" style="padding-bottom: 2.25px;" on:click={() => openForm()}><img width="30" height="30" style="padding-bottom: 2.25px;" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
                    {/if}
                </div>
                <div class="search">
                    <div class="search-input-container">
                        <input type="text" class="search-bar" placeholder="Search tasks..." bind:value={searchQuery} on:input={filterTasks} on:keydown={ (e) => { if (e.key === "Enter")e.preventDefault(); }} >
                        <button class="search-icon" on:click={filterTasks}>🔍</button>
                        {#if searchQuery !== ""}
                            <button class="reset-icon" on:click={resetSearch}>❌</button>
                        {/if}
                    </div>
                </div>
            </div>
            {#if $userRole === 'Manager' || $userRole === 'Employee'}
            <hr>
                <TaskForm 
                    bind:showForm
                    bind:taskData
                    bind:editId
                />
            {/if}
        </div>
        <div class="task-view">
            {#if $userRole === 'Admin'}
            <div class="all-task-container">
                {#if Object.keys(filteredTasks).length > 0}
                    {#each Object.entries(filteredTasks ?? {}) as [office, tasks]}
                        <h3 class="office-name">{office}</h3>
                        <div class="task-holder-container" >
                            <div class="task-holder">
                                {#each tasks as task}
                                    <button class="task-card" on:click={() => handleTaskDetails(task, office)} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskDetails(task, office); }} aria-label={`Task: ${task.title}`}>
                                        <div class="task-header">{task.title}</div>
                                        <p>Tasked By: <strong>{task.assignedToName}</strong></p>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {:else}
                        <p style="text-align: center; color: red;">No Tasks Found!</p>
                {/if}
            </div>
                {#if showForm && selectedTask}
                    <div class="overlay">
                        <div class="form-container">
                            <button class="close-btn" on:click={clearForm}>&times;</button>
                            <h4>{selectedOffice}: Task Information</h4>
                            <div class="form-inputs">
                                <div class="form-group">
                                    <label for="title">Title</label>
                                    <input bind:value={selectedTask.title} style="cursor: default;" readonly/>    
                                </div>
                                <div class="form-group">
                                    <label for="description">Description</label>
                                    <textarea bind:value={selectedTask.description} style="cursor: default;" readonly></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="start-date">Created By</label>
                                    <input bind:value={selectedTask.createdByName} style="cursor: default;" readonly/>    
                                </div>
                                <div class="form-group">
                                    <label for="end-date">Assigned To</label>
                                    <input bind:value={computedAssignedTo} style="cursor: default;" readonly/>    
                                </div>
                                <div class="form-group">
                                    <label for="status">Status</label>
                                    <input bind:value={selectedTask.status} style="cursor: default;" readonly/>  
                                </div>                                    
                            </div>
                        </div>
                    </div>
                {/if}
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
        </div>
    </div>
{/if}

