<script lang="ts">
    import type { TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, tasks } from "$lib/api/taskService";
    import { goto } from "$app/navigation";
    import { isAuthenticated, user, type User } from "$lib/stores/user";
    import { onMount } from "svelte";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import TaskForm from "../../components/TaskForm.svelte";
    import { derived, get, writable } from "svelte/store";
    import TaskListManager from "../../components/TaskListManager.svelte";
    import { selectedStatuses } from "$lib/stores/task";
    import { loadArchiveTasks } from "$lib/api/archive";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");
    
    let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let showForm = false;
    let showFilters = false;
    let editId: any = null;

    let filteredManagerTasks: TaskData[] = [];
    let filteredEmployeeTasks: TaskData[] = [];
    
    let managerTasks: TaskData[] = [];
    let employeeTasks: TaskData[] = [];
    // let archivedTasks: TaskData[] = [];
    let archivedTasks = writable<TaskData[]>([]);

    let selectedDepartments: any = [];

    let selectedTask: any;
    let selectedOffice: any;
    let computedAssignedTo: any;

    let allTasks: Record<string, TaskData[]> = {}; 
    let filteredTasks: Record<string, TaskData[]> = {};
    
    let errorMessage = '';
    let successMessage = ''; 
    let searchQuery = "";
    let currentUser;
    let statusClass = '';

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
        createdByName: null,
        creatorRole: null,
        assigneeRole: null,
        // isArchived: null
    };

    $: currentUser = get(user);
    $ : if ($tasks && get(user) && Array.isArray($tasks)){
            if(currentUser?.role === "Manager"){
                managerTasks = $tasks.filter(task => (task.createdBy === currentUser.id || task.assignedTo === currentUser.id) && !task.isArchived);
                // managerTasks = $tasks.filter(task => task.createdBy === currentUser.id || task.assignedTo === currentUser.id);
                filteredManagerTasks = [ ...managerTasks ];

                // employeeTasks = $tasks.filter(task => task.createdBy !== currentUser.id);
                employeeTasks = $tasks.filter(task => (task.createdBy !== currentUser.id) && !task.isArchived);
                filteredEmployeeTasks = [ ...employeeTasks ];

                loadArchiveTasks().then(tasks => archivedTasks.set(tasks));

            } else {
                // employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
                employeeTasks = $tasks.filter(task => (task.assignedTo === currentUser?.id) && !task.isArchived);
                filteredEmployeeTasks = [ ...employeeTasks ];

                loadArchiveTasks().then(tasks => archivedTasks.set(tasks));
            }
            
            // loadArchiveTasks();
    }

    onMount(async () => {
        if (!isAuthenticated) {
            goto('/login');
            return;
        }

        if(currentUser){
            const fetchedTasks = await fetchTasks(
                                            currentUser?.id ?? 0, 
                                            currentUser?.role ?? '', 
                                            currentUser?.office ?? ''
                                        );
                                        
            const archivedTask = await loadArchiveTasks();
            archivedTasks.set(archivedTask);

            console.log('Archived Tasks (Console in the parent component): ',archivedTasks)
            
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

    function openTaskForm(task: TaskData | null = null) {
        taskData = {
            id: task?.id ?? null,
            title: task?.title ?? "",
            description: task?.description ?? "",
            status: task?.status ?? "Pending",
            startDate: task?.startDate ? task.startDate.split("T")[0] : "",
            endDate: task?.endDate ? task.endDate.split("T")[0] : "",
            assignedTo: task?.assignedTo ?? null,
            createdBy: task?.createdBy ?? get(user)?.id ?? null,
            assignedToName: task?.assignedToName ?? null,
            createdByName: task?.createdByName ?? null
        };
        editId = task?.id ?? null;
        showForm = true;
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
                        (task.assignedToName?.toLowerCase() ?? "").includes(search) ||
                        (task.status?.toLowerCase() ?? "").includes(search)
                    );

                    filteredEmployeeTasks = employeeTasks.filter(task =>
                        (task.title?.toLowerCase() ?? "").includes(search) ||
                        (task.description?.toLowerCase() ?? "").includes(search) ||
                        (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                        (task.status?.toLowerCase() ?? "").includes(search)
                    );

                    archivedTasks.update(tasks => tasks.filter(task =>
                        (task.title?.toLowerCase() ?? "").includes(search) ||
                        (task.description?.toLowerCase() ?? "").includes(search) ||
                        (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                        (task.status?.toLowerCase() ?? "").includes(search)
                    ));

                    // archivedTasks = archivedTasks.filter(task =>
                    //     (task.title?.toLowerCase() ?? "").includes(search) ||
                    //     (task.description?.toLowerCase() ?? "").includes(search) ||
                    //     (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                    //     (task.status?.toLowerCase() ?? "").includes(search)
                    // );

                    console.log('Archived Search Bar: ', archivedTasks)

                } else {
                    filteredManagerTasks = [ ...managerTasks ];
                    filteredEmployeeTasks = [ ...employeeTasks ];
                    $archivedTasks = [ ...$archivedTasks ];
                }
                break;

            case "Employee" : 
                filteredEmployeeTasks = employeeTasks.filter(task =>
                    (task.title?.toLowerCase() ?? "").includes(search) ||
                    (task.description?.toLowerCase() ?? "").includes(search) ||
                    (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                    (task.status?.toLowerCase() ?? "").includes(search)
                );

                archivedTasks.update(tasks => tasks.filter(task =>
                    (task.title?.toLowerCase() ?? "").includes(search) ||
                    (task.description?.toLowerCase() ?? "").includes(search) ||
                    (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                    (task.status?.toLowerCase() ?? "").includes(search)
                ));

                // archivedTasks = archivedTasks.filter(task =>
                //     (task.title?.toLowerCase() ?? "").includes(search) ||
                //     (task.description?.toLowerCase() ?? "").includes(search) ||
                //     (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                //     (task.status?.toLowerCase() ?? "").includes(search)
                // );
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

    function updateStatusFilter(status: string) {
        selectedStatuses.update(current => {
            return current.includes(status) 
                ? current.filter(s => s !== status) 
                : [...current, status];
        });

        filterByStatus(); 
    }

    function filterByStatus(){   
        if($selectedStatuses.length === 0){
            filteredManagerTasks = [ ...managerTasks ];
            filteredEmployeeTasks = [ ...employeeTasks ];
            loadArchiveTasks().then(tasks => archivedTasks.set(tasks));
            // loadArchiveTasks();
            return;
        }

        filteredManagerTasks = managerTasks.filter(task =>
            $selectedStatuses.includes(task.status)
        );

        filteredEmployeeTasks = employeeTasks.filter(task =>
            $selectedStatuses.includes(task.status)
        );
        
        archivedTasks.update(tasks => tasks.filter(task =>
            $selectedStatuses.includes(task.status)
        ));

        // archivedTasks = archivedTasks.filter(task =>
        //     $selectedStatuses.includes(task.status)
        // );
    }

    function updateSelection(department: string) {
        if (selectedDepartments.includes(department)) {
            selectedDepartments = selectedDepartments.filter((dep: string) => dep !== department);
        } else {
            selectedDepartments = [...selectedDepartments, department];
        }
        filterByDept();
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
                // loadArchiveTasks().then(tasks => archivedTasks = tasks);
                loadArchiveTasks().then(tasks => archivedTasks.set(tasks));
                break;
            
            case "Employee":
                filteredEmployeeTasks = [ ...employeeTasks ];
                // loadArchiveTasks().then(tasks => archivedTasks = tasks);
                loadArchiveTasks().then(tasks => archivedTasks.set(tasks));
                break;
        
            default:
                filteredTasks = { ...allTasks };
                // loadArchiveTasks().then(tasks => archivedTasks.set(tasks));
                // loadArchiveTasks().then(tasks => archivedTasks = tasks);
                break;
        }
    }

    function handleTaskDetails(task: any, office: any){
        selectedTask = task;
        selectedOffice = office;
        computedAssignedTo = task.createdByName === task.assignedToName ? 'N/A' : task.assignedToName;
        showForm = true;

        statusClass = getStatusClass(task.status);
        return statusClass;
    }

    function getStatusClass(status: any){
        switch (status) {
            case "Completed": return "text-green-500";
            case "Overdue":
            case "Cancelled": return "text-red-500";
            case "Pending":
            case "In Progress": return "text-black-500";
        default: return "";
        }
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
                            <div class="filter-container">
                                <div class="filter-header">Filter by Status</div>
                                <div class="checkbox-group">
                                    {#each Array.from(new Set([...managerTasks, ...employeeTasks, ...$archivedTasks].map(task => task.status))) as status}
                                        <label>
                                            <input type="checkbox" 
                                                   checked = {$selectedStatuses.includes(status)}
                                                   on:change={() => updateStatusFilter(status)} />
                                            {status}
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        <button class="add-btn" on:click={() => openTaskForm()}><img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
                    {/if}
                    {#if $userRole === 'Employee'}
                        <button class="add-btn" style="padding-bottom: 2.25px;" on:click={() => openTaskForm()}><img width="30" height="30" style="padding-bottom: 2.25px;" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add--v1.png" alt="add--v1"/><span>Add Task</span></button>
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
                                            <p>Role: <strong>{task.assigneeRole}</strong></p>
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
                                    <input bind:value={selectedTask.status} class={statusClass} style="cursor: default;" readonly/>  
                                </div>                                    
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
            {#if filteredEmployeeTasks || filteredManagerTasks || $archivedTasks}
                <TaskListManager 
                    {filteredEmployeeTasks} 
                    {filteredManagerTasks} 
                    archivedTasks={archivedTasks}
                    {openTaskForm}
                />
                {:else}
                    <p>Loading tasks...</p>
            {/if}      
        </div>
    </div>
{/if}

