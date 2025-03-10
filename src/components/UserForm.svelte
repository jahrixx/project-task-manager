<script lang="ts">
    import { writable } from 'svelte/store';
    import { users, offices } from '../lib/mockData';

    export let user;
    export let onSubmit;
    export let onCancel;
    let showForm = writable(true);

</script>

{#if $showForm}
    <div class="overlay">
        <div class="modal">
            <button class="close-btn" on:click={onCancel}>✖</button>
            <h2 style="color: #175e88;">Add User</h2>
            <form on:submit|preventDefault={onSubmit}>
                <div class="form-group">
                    <label for="firstname">First Name</label>
                    <input type="text" id="firstname" placeholder="Enter First Name" bind:value={user.firstname} />
                </div>
                <div class="form-group">
                    <label for="lastname">Last Name</label>
                    <input type="text" id="lastname" placeholder="Enter Last Name" bind:value={user.lastname} />
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <input type="text" id="address" placeholder="Enter Address" bind:value={user.address} />
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="number" id="tel" placeholder="Enter Phone Number" bind:value={user.number} />
                </div>
                <div class="form-group">
                    <label for="birthday">Birthday</label>
                    <input type="date" id="birthday" bind:value={user.birthday} />
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="role">Role</label>
                        <select id="role" bind:value={user.role}>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="office">Office</label>
                        <select id="office" bind:value={user.office}>
                            <option value={null}>No Office</option>
                            {#each $offices as office}
                                <option value={office}>{office}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit">Save</button>
                    <!-- <button type="button" on:click={onCancel}>Cancel</button> -->
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
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
        font-family: Arial, Helvetica, sans-serif;
        z-index: 20000;
    }

    .modal {
        background: white;
        padding: 20px;
        border-radius: 10px;
        width: 400px;
        position: relative;
    }

    .close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    }

    .form-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .form-group label {
        flex: 1;
        font-weight: bold;
        font-size: small;
    }

    .form-group input,
    .form-group select {
        flex: 2;
        padding: 8px;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 5px;
    }

    .form-group-row {
        display: flex;
        gap: 10px;
    }

    .form-group-row .form-group {
        flex: 1;
    }

    .form-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
    }

    button {
        padding: 8px 25px;
        border: none;
        border-radius: 15px;
        cursor: pointer;
    }

    button[type="submit"] {
        background: #23BEDA;
        color: white;
    }
</style>