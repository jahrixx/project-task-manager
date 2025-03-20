<script lang="ts">
    import { onMount } from 'svelte';
    import { createUser, getUsers, updateUser, deleteUser, getRoles, getOffices } from '$lib/api/userService';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { goto } from '$app/navigation';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    import { get } from 'svelte/store';
    
    let users: User[] = [];
    let allUsers: User[] = [];
    let groupedUsers: User[] = [];
    let searchQuery = '';
    let form: User = {
        firstName:"",
        lastName:"",
        role:"",
        office:"",
        number:"",
        address:"",
        birthday:""
    };
    let showForm = false;
    let showFilters = false;

    let editId: any = null;
    let rolesArray: any = [];
    let officesArray: any = [];
    let selectedDepartments: string[] = [];

    let roleOrder: string[] = ['Admin', 'Employee', 'Manager'];

    onMount(async () => {
        if(!isAuthenticated){
            goto('/login');
            return;
        }

        allUsers = await getUsers();
        users = [ ...allUsers ];
        rolesArray = await getRoles();
        officesArray = await getOffices();
        roleOrder = rolesArray.map((role: any) => role.name)   
    });
    
    $ : groupedUsers = groupedAndOrderUsers(users, roleOrder)

    function groupedAndOrderUsers(users: User[], roleOrder: string[]): User[] {
        const grouped: Record<string, User[]> = users.reduce((acc, user) => {
            if (user.role) {  // Ensure user.role is not undefined
                if (!acc[user.role]) {
                    acc[user.role] = [];
                }
                acc[user.role].push(user);
            }
            return acc;
        }, {} as Record<string, User[]>);

        return roleOrder.flatMap(role =>
            grouped[role] ? grouped[role].sort((a, b) => (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`)) : []);
    }

    async function refreshUsers(){
        allUsers = await getUsers();
        users = [ ...allUsers ]
    }

    function toggleFilter(){
        showFilters = !showFilters;
    }

    function updateSelection(department: string){
        if(selectedDepartments.includes(department)){
            selectedDepartments = selectedDepartments.filter(dep => dep !== department);
        } else {
            selectedDepartments = [ ...selectedDepartments, department ]
        }

        filterByDept();
    }

    function filterByDept() {
        if(selectedDepartments.length === 0){
            refreshUsers();
            return;
        }

        groupedUsers = allUsers.filter(user => selectedDepartments.includes(user.office ?? ""));
    }
    
    function filterUsers() {
        groupedUsers = allUsers.filter(user =>
            (user.firstName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.lastName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.username?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.office?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.role?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (`${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase()).includes(searchQuery.toLowerCase())
        );

        if(groupedUsers.length === 0){
            alert("No Users Found!");
            return;
        }
    }
    
    async function handleSubmit() {
        if (!form.firstName || !form.lastName) {
            alert("First Name and Last Name are required.");
            return;
        }

        try {
            if (editId) {
                await updateUser(editId, form);
                alert("User updated successfully!");
            } else {
                await createUser(form);
                alert("User created successfully!");
            }

            await refreshUsers();
            form = { firstName: "", lastName: "", role: "", office: "", number: "", address: "", birthday: "" };
            editId = null;
            showForm = false;
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred.");
        }
    }

    function editUser(user: User) {
        form = { 
            firstName: user.firstName || "", 
            lastName: user.lastName || "", 
            role: user.role || "", 
            office: user.office || "", 
            number: user.number || "", 
            address: user.address || "", 
            birthday: user.birthday ? user.birthday.split("T")[0] : "" 
        };
        editId = user.id;
        showForm = true;
    }

    function closeForm() {
        showForm = false;
        editId = null;
        
        form = {
            firstName: "",
            lastName: "",
            role: "",
            office: "",
            number: "",
            address: "",
            birthday: ""
        };
    }

    function resetSearch() {
        searchQuery = '';
        refreshUsers();
    }

    async function removeUser(id: number | undefined) {
        if (id === undefined) {
            console.error("Cannot delete user: ID is undefined.");
            return;
        }
        await deleteUser(id);
        await refreshUsers();
    }

</script>

<title>User Management</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/user-management.css">
</head>

<main>
{#if !isAuthenticated}
    <Login />
{:else}
    <div class="container">
        <Sidebar />
        <div class="main-container">
            <UserProfile />
            <div class="header">
                <div class="control-btn">
                    <button class="filter-btn" on:click={toggleFilter}><img width="22" height="22" src="https://img.icons8.com/ios-filled/50/FFFFFF/filter--v1.png" alt="filter--v1"/></button>
                    <button class="add-btn" on:click={() => showForm = true}><img width="25" height="25" src="https://img.icons8.com/ios-glyphs/30/FFFFFF/add-user-male.png" alt="add-user-male"/><span>Add User</span></button>
                    
                    {#if showFilters}
                        <div class="filter-container">
                            <div class="filter-header">Filter by Department</div>
                            <div class="checkbox-group">
                                {#each officesArray as office}
                                    <label>
                                        <input type="checkbox" checked = {selectedDepartments.includes(office.officeName)} on:change={() => updateSelection(office.officeName)}/>
                                        {office.officeName}
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="search">
                    <div class="search-input-container">
                        <input type="text" class="search-bar" placeholder="Search" bind:value={searchQuery} on:keydown={ (e) => { if (e.key === "Enter")e.preventDefault(); }} >
                        <button class="search-icon" on:click={filterUsers}>🔍</button>
                        {#if searchQuery}
                            <button class="reset-icon" on:click={resetSearch}>❌</button>
                        {/if}
                    </div>
                </div>
            </div>
            {#if showForm}
                <div class="overlay">
                    <div class="form-container">
                        <button class="close-btn" on:click={closeForm}>&times;</button>
                        <h3 class="header-title">{editId ? "Update" : "Create"} User</h3>
                        <div class="form-inputs">
                            <form on:submit|preventDefault={handleSubmit}>
                                <div class="form-group">
                                    <label for="firstname">First Name</label>
                                    <input bind:value={form.firstName} type="text" placeholder="Enter First Name" />    
                                </div>
                                <div class="form-group">
                                    <label for="lastname">Last Name</label>
                                    <input bind:value={form.lastName} type="text" placeholder="Enter Last Name" />    
                                </div>
                                <div class="form-group">
                                    <label for="number">Phone Number</label>
                                    <input bind:value={form.number} type="tel" placeholder="Enter Number" />    
                                </div>
                                <div class="form-group">
                                    <label for="address">Address</label>
                                    <input bind:value={form.address} type="text" placeholder="Enter Address" />    
                                </div>
                                <div class="form-group">
                                    <label for="birthday">Birthday</label>
                                    <input bind:value={form.birthday} type="date" placeholder="Enter Birthday" />    
                                </div>
                                <div class="select-tags">
                                    <div class="form-group2">
                                        <label for="role">Role</label>
                                        <select bind:value={form.role}>
                                            <option value="">Select Role</option>
                                            {#each rolesArray as role}
                                                <option value={role.name}>{role.name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="form-group2">
                                        <label for="office">Office</label>
                                        <select bind:value={form.office}>
                                            <option value="">Select Office</option>
                                            {#each officesArray as office}
                                                <option value={office.officeName}>{office.officeName}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                                <div class="form-btns">
                                    <button type="submit">{editId ? "Update" : "Create"} User</button>
                                    {#if editId}
                                        <button type="button" on:click={() => { form = {}; editId = null; }}>Cancel</button>
                                    {/if}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Office Designation</th>
                            <th>Position</th>
                            <th style="text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if groupedUsers.length > 0}
                            {#each groupedUsers as user}
                                <tr>
                                    <td>{user.firstName} {user.lastName}</td>
                                    <td>{user.username}</td>
                                    <td>{user.office}</td>
                                    <td>{user.role}</td>
                                    <td class="actions" style="text-align: center;">
                                        <button class="btn edit" on:click={() => editUser(user)}>Edit</button>
                                        <button class="btn delete" on:click={() => removeUser(user.id)}>Delete</button>
                                    </td>
                                </tr>
                            {/each}
                            {:else}
                                <tr>
                                    <td colspan="5" style="padding-top: 30px; text-align: center; color: red;">No users found</td>
                                </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
{/if}
</main>