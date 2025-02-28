<script>
    import { tasks } from '$lib/mockData';
    import { showTaskForm } from '../../lib/stores';
    import { newTaskForm } from '../../lib/stores';
    import { createTask, 
             editTask, 
             updateTask,
             deleteTask, 
             assignTask, 
             changeTaskStatus } from '../../lib/stores.js';
</script>

<div class="main-container">
    <h2>Task Management</h2>
    <button on:click={() => showTaskForm.set(true)}>Create Task</button>
    
    {#if $showTaskForm}
        <div>
            <input bind:value={$newTaskForm.title} placeholder="Task Title" />
            <select bind:value={$newTaskForm.status}>
                <option value="To Do">To Do</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
            </select>
            <button on:click={createTask}>Save Task</button>
            <button on:click={() => showTaskForm.set(false)}>Cancel</button>
        </div>
    {/if}
    
    <ul>
        {#each $tasks as task}
            <li>
                {task.title} - {task.status}
                <button on:click={() => editTask(task)}>Edit</button>
                <button on:click={() => deleteTask(task.id)}>Delete</button>
                <select on:change={(e) => assignTask(task.id, e)}>
                    <option value="0">Unassigned</option>
                    <!-- Add dynamic user options here -->
                </select>
                <select on:change={(e) => changeTaskStatus(task.id, e)}>
                    <option value="To Do">To Do</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                </select>
            </li>
        {/each}
    </ul>
</div>

<style>
    .main-container{
        flex: 1;
        /* margin-left: 250px; */
        padding: 20px;
        overflow-y: auto;
        background: #ffffff;
    }
</style>
