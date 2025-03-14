<script lang="ts">
    import { writable } from 'svelte/store';
    import { users } from '../lib/mockData';

    export let task;
    export let onSubmit;
    export let onCancel;
    export let managersOffice;
    export let managerRole;
</script>

<form on:submit|preventDefault={onSubmit}>
    <input type="text" placeholder="Task Title" bind:value={task.title} />
    <select bind:value={task.status}>
        <option value="To Do">To Do</option>
        <option value="Ongoing">Ongoing</option>
        <option value="Completed">Completed</option>
    </select>
    {#if managerRole === "Manager"}
        <select bind:value={task.assignedTo}>
            <option value={null}>Assign to Self</option>
            {#each $users.filter((user) => user.office === managersOffice && user.role === 'Employee') as user}
                <option value={user.id}>{user.email}</option>
            {/each}
        </select>
    {/if}
    <button type="submit">Save</button>
    <button on:click={onCancel}>Cancel</button>
</form>