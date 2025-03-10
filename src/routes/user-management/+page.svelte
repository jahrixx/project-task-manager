<script lang="ts">
    import { onMount } from 'svelte';
    import { createUser, getUsers, updateUser, deleteUser, getRoles, getOffices } from '$lib/api/userService';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { goto } from '$app/navigation';
    import Login from '../login/+page.svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import UserProfile from '../../components/UserProfile.svelte';
    
    let users: User[] = [];
    let allUsers: User[] = [];
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

    onMount(async () => {
        if(!isAuthenticated){
            goto('/login');
            return;
        }

        allUsers = await getUsers();
        users = allUsers;
        rolesArray = await getRoles();
        officesArray = await getOffices();
    });

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
            users = allUsers;
            return;
        }

        users = allUsers.filter(user => selectedDepartments.includes(user.office ?? ""));
    }
    function filterUsers() {
        users = allUsers.filter(user =>
            (user.firstName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.lastName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.username?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.office?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.role?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (`${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase()).includes(searchQuery.toLowerCase())
        );

        if(users.length === 0){
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
                alert("✅ User updated successfully!");
            } else {
                await createUser(form);
                alert("✅ User created successfully!");
            }

            allUsers = await getUsers();
            users = allUsers;
            form = { firstName: "", lastName: "", role: "", office: "", number: "", address: "", birthday: "" };
            editId = null;
            showForm = false;
        } catch (error) {
            console.error("❌ Error:", error);
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
        users = allUsers;
    }

    async function removeUser(id: number | undefined) {
        if (id === undefined) {
            console.error("❌ Cannot delete user: ID is undefined.");
            return;
        }
        await deleteUser(id);
        users = await getUsers();
    }

</script>

<title>User Management</title>
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
                        <input type="text" class="search-bar" placeholder="Search by user" bind:value={searchQuery} on:keydown={ (e) => { if (e.key === "Enter")e.preventDefault(); }} >
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
                        {#if users.length > 0}
                            {#each users as user}
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

<style>
    .main-container {
        margin-left: 250px;
    }

    .header-title {
        margin-bottom: 20px;
        margin-top: 0;
        font-size: 1.5rem;
        font-weight: bold;
        font-family: Arial, Helvetica, sans-serif;
        color: #175e88;
    }

    /* header section */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 3rem;
        padding-right: 2rem;
        /* border-bottom: 1px solid black; */
    }

    .control-btn {
        display: flex;
        gap: 10px;
        position: relative;
    }

    /* filter button styles */
    .filter-btn {
        text-align: center;
        height: 40px;
        width: 40px;
        border: none;
        border-radius: 50%;
        background-color: #23BEDA;
        color: white;
        cursor: pointer;
        transition: background-color 0.3 ease;
    }

    .filter-btn img {
        margin: 0;
        padding-top: 5px;
        padding-left: 1px;
    }

    .filter-container {
        position: absolute;
        top: 120%;
        left: 0;
        background-color: white;
        padding: 10px;
        border-radius: 10px;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
        width: 335px;
        z-index: 10;
    }

    .filter-header {
        font-weight: bold;
        font-size: 1rem;
        margin-bottom: 10px;
    }

    .checkbox-group {
        display: flex;
        flex-wrap: wrap;
    }

    .checkbox-group label {
        display: flex;
        align-items: center;
        width: 50%;
        margin-bottom: 5px;
    }

    /* Add user styes */
    .add-btn {
        display: flex;
        /* padding: 0.7rem; */
        border: none;
        border-radius: 25px;
        background-color: #23BEDA;
        color: white;
        cursor: pointer;
        transition: background-color 0.3 ease;
    }
    .add-btn img {
        margin: 0;
        padding-left: 5px;
        padding-top: 5px;
    }
    .add-btn span {
        font-size: 1rem;
        margin: 0;
        padding-left: 7px;
        padding-right: 5px;
        padding-top: 10px;
    }

    .filter-btn:hover, .add-btn:hover {
        background-color: #175e88;
    }

    /* searchbar styles */
    .search {
        flex-grow: 1;
        display: flex;
        justify-content: flex-end;
        padding-right: 1rem;
    }

    .search-input-container {
        display: flex;
        align-items: center;
        position: relative;
        width: 300px;
    }

    .search-icon, .reset-icon {
        position: absolute;
        right: 10px;
        cursor: pointer;
        font-size: 16px;
        background: none;
        border: none;
    }

    .search-icon {
        padding-top: 1px;
        right: 32.5px;
        font-size: 18px;
    }

    .search-bar {
        padding: 0.8rem;
        border: 1px solid black;
        border-radius: 5px;
        width: 350px;
        transition: border-color 0.3 ease;
        padding-left: 22.5px;
    }

    .search-bar:focus {
        outline: none;
        border-color: #23BEDA;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, .3);
    }

    /* table styles */
    .table-container {
        width: 92%;
        height: 73vh;
        border-collapse: collapse;
        padding: 5px;
        margin: auto;
        /* border: 1px solid black; */
    }

    table {
        width: 100%;
        margin-top: 1rem;
        border-collapse: collapse;
        font-size: 1rem;
        font-family: Arial, Helvetica, sans-serif;
    }

    th {
        border-bottom: 3px solid lightgray;
        padding:  10px 10px 2px 10px;
        font-weight: bold;
        text-align: left;
    }
    
    td {
        padding: 10px;
        text-align: left;
        /* border: 1px solid black; */
    }
    
    /* Custom column width */
    th:nth-child(1), td:nth-child(1) { width: 20%; }
    th:nth-child(2), td:nth-child(2) { width: 20%; }
    th:nth-child(3), td:nth-child(3) { width: 25%; }
    th:nth-child(4), td:nth-child(4) { width: 15%; }
    th:last-child, td:last-child { width: auto; }

    thead, tbody tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }

    tbody {
        display: block;
        max-height: 450px;
        overflow-y: auto;
    }

    /* Scrollbar Styles */
    :global(tbody::-webkit-scrollbar){
        width: 0;
        background: transparent;
    }

    /* overlay and form styles */
    .form-btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, .5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .form-container {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        position: relative;
        width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 0.9rem;
    }

    .form-inputs form {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 10px;
    }

    input {
        padding: 5px;
        border: 1px solid black;
        border-radius: 8px;
        /* width: 100%; */
    }

    .close-btn {
        position: absolute;
        top: 0;
        right: 12px;
        background: none;
        border: none;
        font-size: 2.5rem;
        cursor: pointer;
        color: #175e88;
    }

    .close-btn:hover {
        color: red;
    }

    button[type="submit"], button[type="button"] {
        background-color: #23BEDA;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
    }

    button[type="submit"]:hover {
        background-color: #175e88;
        color: white;
    }

    button[type="button"]:hover {
        background-color: red;
        color: white;
    }

    .actions .btn {
        background-color: #23BEDA;
        color: white;
        border: none;
        padding: 6px;
        border-radius: 5px;
        cursor: pointer;
    }

    .actions .edit:hover {
        background-color: #175e88;
        color: white;
    }

    .actions .delete:hover {
        background-color: red;
        color: white;
    }

    /* form groups styles */
    .form-group {
        display: flex;
        width: 100%;
    }

    .form-group2 {
        display: flex;
        width: 100%;
        gap: 10px;
    }
    
    .form-group label {
        padding-top: 8px;
        width: 200px;
        font-weight: bold;
    }

    .form-group2 label {
        padding-top: 8px;
        width: 50px;
        font-weight: bold;
    }

    .form-group2:nth-child(2){
        padding-left: 10px;
    }

    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }

    .form-group2 select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }

    .select-tags {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>