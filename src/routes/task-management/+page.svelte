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
    let filteredArchivedTasks: TaskData[] = [];
    
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

                loadArchiveTasks().then(tasks => {
                    archivedTasks.set(tasks);
                    filteredArchivedTasks = tasks;
                });

            } else {
                // employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
                employeeTasks = $tasks.filter(task => (task.assignedTo === currentUser?.id) && !task.isArchived);
                filteredEmployeeTasks = [ ...employeeTasks ];

                loadArchiveTasks().then(tasks => {
                    archivedTasks.set(tasks);
                    filteredArchivedTasks = tasks;
                });
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
            filteredArchivedTasks = archivedTask;
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

                    archivedTasks.update(tasks => filteredArchivedTasks = tasks.filter(task =>
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
                    filteredArchivedTasks = [ ...$archivedTasks ];
                }
                break;

            case "Employee" : 
                filteredEmployeeTasks = employeeTasks.filter(task =>
                    (task.title?.toLowerCase() ?? "").includes(search) ||
                    (task.description?.toLowerCase() ?? "").includes(search) ||
                    (task.createdByName?.toLowerCase() ?? "").includes(search) ||
                    (task.status?.toLowerCase() ?? "").includes(search)
                );

                archivedTasks.update(tasks =>  filteredArchivedTasks =  tasks.filter(task =>
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
            loadArchiveTasks().then(tasks => {
                archivedTasks.set(tasks);
                filteredArchivedTasks = tasks;
            });
            // loadArchiveTasks();
            return;
        }

        filteredManagerTasks = managerTasks.filter(task =>
            $selectedStatuses.includes(task.status)
        );

        filteredEmployeeTasks = employeeTasks.filter(task =>
            $selectedStatuses.includes(task.status)
        );
        
        archivedTasks.update(tasks => filteredArchivedTasks = tasks.filter(task =>
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
                loadArchiveTasks().then(tasks => {
                    archivedTasks.set(tasks);
                    filteredArchivedTasks = tasks;
                });
                break;
            
            case "Employee":
                filteredEmployeeTasks = [ ...employeeTasks ];
                // loadArchiveTasks().then(tasks => archivedTasks = tasks);
                loadArchiveTasks().then(tasks => {
                    archivedTasks.set(tasks);
                    filteredArchivedTasks = tasks;
                });
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
                        <button class="filter-btn" on:click={toggleFilter} aria-label="filter-btn">
                            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V6.17157C22 6.96722 21.6839 7.73028 21.1213 8.29289L15.2929 14.1213C15.1054 14.3089 15 14.5632 15 14.8284V17.1716C15 17.9672 14.6839 18.7303 14.1213 19.2929L11.9193 21.4949C10.842 22.5722 9 21.8092 9 20.2857V14.8284C9 14.5632 8.89464 14.3089 8.70711 14.1213L2.87868 8.29289C2.31607 7.73028 2 6.96722 2 6.17157V5Z" fill="#FFFFFF"/>
                            </svg>
                        </button>
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
                        <button class="filter-btn" on:click={toggleFilter} aria-label="filter-btn">
                            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V6.17157C22 6.96722 21.6839 7.73028 21.1213 8.29289L15.2929 14.1213C15.1054 14.3089 15 14.5632 15 14.8284V17.1716C15 17.9672 14.6839 18.7303 14.1213 19.2929L11.9193 21.4949C10.842 22.5722 9 21.8092 9 20.2857V14.8284C9 14.5632 8.89464 14.3089 8.70711 14.1213L2.87868 8.29289C2.31607 7.73028 2 6.96722 2 6.17157V5Z" fill="#FFFFFF"/>
                            </svg>
                        </button>
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
                        <button class="add-btn" on:click={() => openTaskForm()}>
                            <svg width="26px" height="26px" viewBox="0 0 512 512" fill="#FFFFFF" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>add-document-note</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="icon" fill="#000000" transform="translate(85.333333, 42.666667)"> <path d="M341.333333,277.333333 L341.332667,341.332333 L405.333333,341.333333 L405.333333,384 L341.332667,383.999333 L341.333333,448 L298.666667,448 L298.666667,383.999333 L234.666667,384 L234.666667,341.333333 L298.666667,341.332333 L298.666667,277.333333 L341.333333,277.333333 Z M234.666667,3.55271368e-14 L341.333333,106.666667 L341.333,256 L298.666,256 L298.666667,124.339779 L216.993555,42.6666667 L42.6666667,42.6666667 L42.6666667,384 L213.333,383.999 L213.333333,405.333333 L277.333333,405.333333 L277.333,426.666 L1.42108547e-14,426.666667 L1.42108547e-14,3.55271368e-14 L234.666667,3.55271368e-14 Z M213.333333,298.666667 L213.333333,341.333333 L64,341.333333 L64,298.666667 L213.333333,298.666667 Z M196,85.3333333 L256,145.333333 L124,277.333333 L64,277.333333 L64,217.333333 L196,85.3333333 Z M157.304,169.265333 L96,230.570667 L96,245.333333 L110.72,245.333333 L172.046,184.007333 L157.304,169.265333 Z M195.989333,130.581333 L179.932,146.637333 L194.674,161.379333 L210.730667,145.322667 L195.989333,130.581333 Z" fill="#FFFFFF" id="Combined-Shape"> </path> </g> </g> </g></svg>
                            <span>Add Task</span>
                        </button>
                    {/if}
                    {#if $userRole === 'Employee'}
                        <button class="add-btn-emp" on:click={() => openTaskForm()}>
                            <svg width="26px" height="26px" viewBox="0 0 512 512" fill="#FFFFFF" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>add-document-note</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="icon" fill="#000000" transform="translate(85.333333, 42.666667)"> <path d="M341.333333,277.333333 L341.332667,341.332333 L405.333333,341.333333 L405.333333,384 L341.332667,383.999333 L341.333333,448 L298.666667,448 L298.666667,383.999333 L234.666667,384 L234.666667,341.333333 L298.666667,341.332333 L298.666667,277.333333 L341.333333,277.333333 Z M234.666667,3.55271368e-14 L341.333333,106.666667 L341.333,256 L298.666,256 L298.666667,124.339779 L216.993555,42.6666667 L42.6666667,42.6666667 L42.6666667,384 L213.333,383.999 L213.333333,405.333333 L277.333333,405.333333 L277.333,426.666 L1.42108547e-14,426.666667 L1.42108547e-14,3.55271368e-14 L234.666667,3.55271368e-14 Z M213.333333,298.666667 L213.333333,341.333333 L64,341.333333 L64,298.666667 L213.333333,298.666667 Z M196,85.3333333 L256,145.333333 L124,277.333333 L64,277.333333 L64,217.333333 L196,85.3333333 Z M157.304,169.265333 L96,230.570667 L96,245.333333 L110.72,245.333333 L172.046,184.007333 L157.304,169.265333 Z M195.989333,130.581333 L179.932,146.637333 L194.674,161.379333 L210.730667,145.322667 L195.989333,130.581333 Z" fill="#FFFFFF" id="Combined-Shape"> </path> </g> </g> </g></svg>
                            <span>Add Task</span>
                        </button>
                    {/if}
                </div>
                <div class="search">
                    <div class="search-input-container">
                        <input type="text" class="search-bar" placeholder="Search tasks..." bind:value={searchQuery} on:input={filterTasks} on:keydown={ (e) => { if (e.key === "Enter")e.preventDefault(); }} >
                        <button class="search-icon" on:click={filterTasks} aria-label="search-icon">
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" fill-rule="evenodd" clip-rule="evenodd" d="M12 3C4.5885 3 3 4.5885 3 12C3 19.4115 4.5885 21 12 21C19.4115 21 21 19.4115 21 12C21 4.5885 19.4115 3 12 3ZM11.5 7.75C9.42893 7.75 7.75 9.42893 7.75 11.5C7.75 13.5711 9.42893 15.25 11.5 15.25C13.5711 15.25 15.25 13.5711 15.25 11.5C15.25 9.42893 13.5711 7.75 11.5 7.75Z" fill="#323232"></path> <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"></path> <path d="M14 14L16 16" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M15 11.5C15 13.433 13.433 15 11.5 15C9.567 15 8 13.433 8 11.5C8 9.567 9.567 8 11.5 8C13.433 8 15 9.567 15 11.5Z" stroke="#323232" stroke-width="2"></path> </g></svg>
                        </button>
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
            {#if filteredEmployeeTasks || filteredManagerTasks || filteredArchivedTasks}
                <TaskListManager 
                    {filteredEmployeeTasks} 
                    {filteredManagerTasks} 
                    {filteredArchivedTasks}
                    {openTaskForm}
                />
                {:else}
                    <p>Loading tasks...</p>
            {/if}      
        </div>
    </div>
{/if}

