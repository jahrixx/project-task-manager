<script lang="ts">
    import { writable } from 'svelte/store';
    import { users, offices } from '../lib/mockData';

    export let user;
    export let onSubmit;
    export let onCancel;
</script>

<form on:submit|preventDefault={onSubmit}>
    <input type="email" placeholder="Email" bind:value={user.email} />
    <select bind:value={user.role}>
        <option value="Admin">Admin</option>
        <option value="Manager">Manager</option>
        <option value="Employee">Employee</option>
    </select>
    <select bind:value={user.office}>
        <option value={null}>No Office</option>
        {#each $offices as office}
            <option value={office}>{office}</option>
        {/each}
    </select>
    <input type="number" placeholder="Phone Number" bind:value={user.number} />
    <input type="text" placeholder="Address" bind:value={user.address} />
    <input type="date" placeholder="Birthday" bind:value={user.birthday} />
    <button type="submit">Save</button>
    <button on:click={onCancel}>Cancel</button>
</form>