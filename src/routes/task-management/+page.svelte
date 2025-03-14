<script lang="ts">
    import { tasks, type TaskData } from "$lib/stores/task";
    import { createTask, deleteTask, fetchEmployees, fetchTasks, updateTask } from "$lib/api/taskService";
    import { goto } from "$app/navigation";
    import { isAuthenticated, user, type User } from "$lib/stores/user";
    import { onMount } from "svelte";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import { derived, get } from "svelte/store";
    import { all } from "axios";
    import TaskView from "../../components/TaskView.svelte";
    import TaskForm from "../../components/TaskForm.svelte";

    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    let editId: any = null;
    let showForm = false;
    let showFilters = false;

    // let managerTasks: TaskData[] = [];
    // let employeeTasks: TaskData[] = [];
    // let allTasks: Record<string, TaskData[]> = {}; 
     
    // let employeesInOffice: { id: number; name: string; role: string; office: string }[] = [];
    let errorMessage = '';
    let successMessage = '';
   

    $ : if ($tasks && get(user) && Array.isArray($tasks)){
            const currentUser = get(user);
        
        if(currentUser?.role === "Manager"){
            managerTasks = $tasks.filter(task => task.createdBy === currentUser.id || task.assignedTo === currentUser.id);
            employeeTasks = $tasks.filter(task => task.createdBy !== currentUser.id);
        } else {
            employeeTasks = $tasks.filter(task => task.assignedTo === currentUser?.id);
        }
    }

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
            } 
    });

    function toggleFilter(){
        showFilters = !showFilters;
    }
</script>

<head>
    <link rel="stylesheet" href="src/components/assets/css/task-management.css">      
</head>
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

            {#if $userRole === 'Manager' || $userRole === 'Employee'}
            <hr>
                {#if showForm}
                    <TaskForm />
                {/if}
            {/if}
        </div>
        <div class="task-view">
            <TaskView />
        </div>
    </div>
{/if}