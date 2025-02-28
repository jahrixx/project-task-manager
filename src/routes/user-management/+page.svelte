<script lang="ts">
    import { writable } from 'svelte/store';
    import UserForm from '../../components/UserForm.svelte';
    import { users, offices, roles } from '../../lib/mockData';
    import { updateUser, createUser, editUser, deleteUser } from '../../lib/stores';
    import { hasRole } from '../../lib/stores';

    let showUserForm = false;
    let newUserForm: { id: number | null; firstname: string; lastname: string; email: string; password: string; role: string; office: string; birthday: string; address: string; number: string } = { id: null, firstname: '', lastname: '', email: '', password: '', role: 'Employee', office: '', birthday: '', address: '', number: '' };


    let editingOffice = writable<number | null>(null); // Track which row is being edited
    let editingRole = writable<number | null>(null);

    function startEditing(userId: number) {
        editingOffice.set(userId);
    }

    function startEditingRole(userId: number) {
        editingRole.set(userId);
    }


    function assignOffice(userId: number, event: Event) {
        const target = event.target as HTMLSelectElement | null;
        if (target) {
            const selectedOffice = target.value;
            users.update(usersList => usersList.map(user => 
                user.id === userId ? { ...user, office: selectedOffice } : user
            ));
            editingOffice.set(null);
        }
    }
   
    function assignRole(userId: number, event: Event) {
        const target = event.target as HTMLSelectElement | null;
        if(target){
            const selectedRole = target.value;
            users.update(usersList => usersList.map(user => 
                user.id === userId ? { ...user, role: selectedRole } : user
            ));
        }
        editingRole.set(null); // Hide dropdown after selection
    }
</script>

{#if hasRole('Admin')}
    <div class="main-container">
        <div class="user-controls">
            <div class="btn-group">
                <button class="icon-btn">
                    <img width="25" height="25" src="https://img.icons8.com/puffy-filled/32/FFFFFF/strawberry-menu--v1.png" alt="strawberry-menu--v1"/>
                </button>
                <button class="add-btn" on:click={() => { showUserForm = true; 
                                                          newUserForm = { id: null, 
                                                                          firstname: '', 
                                                                          lastname: '', 
                                                                          email: '', 
                                                                          password: '', 
                                                                          role: 'Employee', 
                                                                          office: '', 
                                                                          birthday: '', 
                                                                          address: '', 
                                                                          number: '' }; }}>
                    <span class="user-icon">
                        <img width="30" height="30" src="https://img.icons8.com/sf-black-filled/64/FFFFFF/add-user-male.png" alt="add-user-male"/>
                    </span> 
                    <p>Add User</p>
                </button>
            </div>
            <div class="search-bar">
                <span class="search-icon">
                    <img width="22" height="22" src="https://img.icons8.com/external-tanah-basah-basic-outline-tanah-basah/24/external-search-essentials-tanah-basah-basic-outline-tanah-basah.png" alt="external-search-essentials-tanah-basah-basic-outline-tanah-basah"/>
                </span>
                <input type="text" placeholder="Search User" />
            </div>
        </div>
        
        {#if showUserForm}
            <UserForm user={newUserForm} onSubmit={newUserForm.id ? updateUser : createUser} onCancel={() => showUserForm = false} />
        {/if}
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Office Designation</th>
                    <th>Position</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {#each $users as user}
                    <tr>
                        <td>{user.firstname} {user.lastname}</td>
                        <td>{user.email}</td>
                        <td>
                            {#if $editingOffice === user.id}
                                <select on:change={(event) => assignOffice(user.id, event)}>
                                    <option value="">No Office</option>
                                    {#each $offices as office}
                                        <option value={office} selected={user.office === office}>{office}</option>
                                    {/each}
                                </select>
                            {:else}
                                {user.office} 
                                <button class="edit-icon-office" on:click={() => startEditing(user.id)}>
                                    <img width="12" height="12" src="https://img.icons8.com/external-anggara-filled-outline-anggara-putra/32/external-create-social-media-interface-anggara-filled-outline-anggara-putra.png" alt="external-create-social-media-interface-anggara-filled-outline-anggara-putra"/>
                                </button>
                            {/if}
                        </td>
                        <td>
                            {#if $editingRole === user.id}
                                <select on:change={(event) => assignRole(user.id, event)}>
                                    {#each $roles as role}
                                        <option value={role} selected={user.role === role}>{role}</option>
                                    {/each}
                                </select>
                            {:else}
                                {user.role} 
                                <button class="edit-icon-role" on:click={() => startEditingRole(user.id)}>
                                    <img width="12" height="12" src="https://img.icons8.com/external-anggara-filled-outline-anggara-putra/32/external-create-social-media-interface-anggara-filled-outline-anggara-putra.png" alt="external-create-social-media-interface-anggara-filled-outline-anggara-putra"/>
                                </button>
                            {/if}
                        </td>
                        <td style="text-align: center;">
                            <button on:click={() => editUser(user)}>Edit</button>
                            <button on:click={() => deleteUser(user.id)}>Delete</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style>
    .main-container{
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: #ffffff;
    }

    /* User Controls */

    .user-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-top: -10px;
    }

    .user-controls .icon-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 42px;
        height: 42px;
        background: #23BEDA;
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: 0.3s;
        margin-left: 3px;
        margin-right: 2px;
    }

    .user-controls .btn-group {
        display: flex;
        align-items: center;
        gap: 10px; /* Add gap between the button and search bar */
    }

    .user-controls .add-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #23BEDA;
        color: white;
        border: none;
        padding: 4px 5px 2px;
        border-radius: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
        white-space: nowrap;
    }

    .btn-group p{
        padding: 0;
        margin: 0;
        margin-left: -5px;
        padding-right: 5px;
    }

    .btn-group button:hover{
        background-color: #175e88;
        cursor: pointer;
    }

    .user-controls .add-btn .user-icon {
        font-size: 1.2em;
    }
   
    .user-controls .search-bar {
        display: flex;
        align-items: center;
        border: 1px solid #ccc;
        border-radius: 10px;
        padding: 10px 5px;
        background-color: white;
        min-width: 400px;
    }

    input::placeholder{
        font-weight: bold;
    }

    .user-controls .search-bar .search-icon {
        color: gray;
        margin-right: 5px;
    }
    .search-icon img{
        margin-top: 1.5px;
        margin-left: 5px;
    }

    .user-controls .search-bar input[type="text"] {
        border: none;
        outline: none;
        flex-grow: 1;
        font-size: 14px;
    }
    
    /* Table Styles */

    .edit-icon-role {
        position: absolute;
        left: 100px;
        top: 50%;
        transform: translateY(-40%);
        cursor: pointer;
        background: none;
        border: none;
        font-size: 15px;
        color: #495057;
        transition: color 0.2s ease-in-out;
    }

    .edit-icon-office {
        position: absolute;
        left: 130px;
        top: 50%;
        transform: translateY(-40%);
        cursor: pointer;
        background: none;
        border: none;
        font-size: 15px;
        color: #495057;
        transition: color 0.2s ease-in-out;
    }
    /* .edit-icon:hover {
        background: rgba(0, 0, 0, 0.1);
    } */

    table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        font-family: Arial, Helvetica, sans-serif;
    }

    thead {
        color: #495057;
        font-size: 14px;
        border-bottom: 3px solid rgb(211, 211, 211);
    }

    th{
        padding: 15px 16px 2px;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
        font-weight: bold;
        font-size: 1rem;
    }

    td {
        position: relative;
        text-align: left;
        padding: 12px 16px;
        white-space: nowrap;
        font-size: 0.8rem;
        /* border: 1px solid black; */
    }

    tbody tr:hover {
        background: #f1f3f5;
    }

    th:first-child, td:first-child {
        border-left: 0;
    }

    th:last-child, td:last-child {
        border-right: 0;
    }

    /* th:nth-child(1), td:nth-child(1) { width: 200px; }
    th:nth-child(2), td:nth-child(2) { width: 250px; }
    th:nth-child(3), td:nth-child(3) { width: 180px; }
    th:nth-child(4), td:nth-child(4) { width: 120px; } */
    th:nth-child(5), td:nth-child(5) { width: 20px; }
</style>