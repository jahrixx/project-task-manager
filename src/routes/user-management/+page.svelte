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
    let loading = true;
    let authed = false

    onMount(async () => {
        authed = get(isAuthenticated);
        
        if(!authed){
            loading = false;
            // goto('/login');
            return;
        }

        try {
            allUsers = await getUsers();
            users = [ ...allUsers ];
            rolesArray = await getRoles();
            officesArray = await getOffices();
            roleOrder = rolesArray.map((role: any) => role.name);    
        } catch (error) {
            console.error("Error fetching data:", error);    
        } finally {
            loading = false;
                if(!loading){
                    groupedUsers = groupedAndOrderUsers(users, roleOrder);
                }
        }
    });
    
    $ : {
        if(searchQuery){
            filterUsers();
        } else {
            users = [ ...allUsers ]
        }
        groupedUsers = groupedAndOrderUsers(users, roleOrder)
    }

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
        if(!searchQuery){
            users = [ ...allUsers ];
            return;
        }
        
        users = allUsers.filter(user =>
            (user.firstName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.lastName?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.username?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.office?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (user.role?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (`${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase()).includes(searchQuery.toLowerCase())
        );
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
        } else if (!confirm("Are you sure you want to delete this User?")) {
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

{#if loading}
    <div class="fullpage-loader">
        <div class="spinner"></div>
    </div>
{:else}
    {#if !authed}
        <Login />
    {:else}
        <div class="container">
            <Sidebar />
            <div class="main-container">
                <UserProfile />
                <div class="header">
                    <div class="control-btn">
                        <button class="filter-btn" on:click={toggleFilter} aria-label="filter-btn">
                            <svg width="26px" height="26px" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V6.17157C22 6.96722 21.6839 7.73028 21.1213 8.29289L15.2929 14.1213C15.1054 14.3089 15 14.5632 15 14.8284V17.1716C15 17.9672 14.6839 18.7303 14.1213 19.2929L11.9193 21.4949C10.842 22.5722 9 21.8092 9 20.2857V14.8284C9 14.5632 8.89464 14.3089 8.70711 14.1213L2.87868 8.29289C2.31607 7.73028 2 6.96722 2 6.17157V5Z" fill="#FFFFFF"/>
                            </svg>
                        </button>
                        <button class="add-btn" on:click={() => showForm = true}>
                            <svg width="27px" height="27px" fill="#FFFFFF" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 612 612" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M275.4,295.8c81.682,0,147.899-66.217,147.899-147.9C423.299,66.218,357.082,0,275.4,0c-81.683,0-147.9,66.217-147.9,147.9 C127.5,229.583,193.717,295.8,275.4,295.8z M345.461,206.604c-6.729,22.246-35.549,38.968-70.09,38.968 c-34.542,0-63.363-16.723-70.091-38.968H345.461z M586.5,510v20.4c0,5.634-4.566,10.2-10.199,10.2H515.1V601.8 c0,5.634-4.566,10.2-10.199,10.2h-20.4c-5.633,0-10.199-4.566-10.199-10.2v-61.199H413.1c-5.633,0-10.199-4.566-10.199-10.2V510 c0-5.633,4.566-10.199,10.199-10.199h61.201v-61.2c0-5.634,4.566-10.2,10.199-10.2h20.4c5.633,0,10.199,4.566,10.199,10.2v61.2 h61.201C581.934,499.8,586.5,504.367,586.5,510z M382.5,510v20.4c0,5.419,1.535,10.438,4.016,14.857 c-30.803,3.35-67.52,5.542-111.116,5.542c-142.607,0-212.393-23.302-237.979-34.686c-6.602-2.938-11.921-11.336-11.921-18.562 V448.8c0-73.056,55.624-133.663,126.599-141.78c2.157-0.247,5.355,0.677,7.113,1.949C191.938,332.66,232.002,346.8,275.4,346.8 s83.463-14.14,116.188-37.831c1.758-1.272,4.957-2.196,7.113-1.949c58.746,6.719,106.869,49.438,121.744,105.37 c-4.572-2.724-9.848-4.389-15.545-4.389h-20.4c-16.873,0-30.6,13.726-30.6,30.6v40.8H413.1C396.227,479.4,382.5,493.126,382.5,510z "></path> </g> </g></svg>
                            <span>Add User</span>
                        </button>
                        
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
                            <button class="search-icon" on:click={filterUsers} aria-label="search-icon">
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" fill-rule="evenodd" clip-rule="evenodd" d="M12 3C4.5885 3 3 4.5885 3 12C3 19.4115 4.5885 21 12 21C19.4115 21 21 19.4115 21 12C21 4.5885 19.4115 3 12 3ZM11.5 7.75C9.42893 7.75 7.75 9.42893 7.75 11.5C7.75 13.5711 9.42893 15.25 11.5 15.25C13.5711 15.25 15.25 13.5711 15.25 11.5C15.25 9.42893 13.5711 7.75 11.5 7.75Z" fill="#323232"></path> <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"></path> <path d="M14 14L16 16" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M15 11.5C15 13.433 13.433 15 11.5 15C9.567 15 8 13.433 8 11.5C8 9.567 9.567 8 11.5 8C13.433 8 15 9.567 15 11.5Z" stroke="#323232" stroke-width="2"></path> </g></svg>
                            </button>
                            {#if searchQuery}
                                <button class="reset-icon" on:click={resetSearch} aria-label="reset-icon">
                                    <svg height="23.5px" width="23.5px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 26 26" xml:space="preserve" fill="#970c0c" stroke="#970c0c"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:#f20202;" d="M21.125,0H4.875C2.182,0,0,2.182,0,4.875v16.25C0,23.818,2.182,26,4.875,26h16.25 C23.818,26,26,23.818,26,21.125V4.875C26,2.182,23.818,0,21.125,0z M18.78,17.394l-1.388,1.387c-0.254,0.255-0.67,0.255-0.924,0 L13,15.313L9.533,18.78c-0.255,0.255-0.67,0.255-0.925-0.002L7.22,17.394c-0.253-0.256-0.253-0.669,0-0.926l3.468-3.467 L7.221,9.534c-0.254-0.256-0.254-0.672,0-0.925l1.388-1.388c0.255-0.257,0.671-0.257,0.925,0L13,10.689l3.468-3.468 c0.255-0.257,0.671-0.257,0.924,0l1.388,1.386c0.254,0.255,0.254,0.671,0.001,0.927l-3.468,3.467l3.468,3.467 C19.033,16.725,19.033,17.138,18.78,17.394z"></path> </g> </g></svg>
                                </button>
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
                                        <input bind:value={form.firstName} type="text" placeholder="Enter First Name" required/>    
                                    </div>
                                    <div class="form-group">
                                        <label for="lastname">Last Name</label>
                                        <input bind:value={form.lastName} type="text" placeholder="Enter Last Name" required/>    
                                    </div>
                                    <div class="form-group">
                                        <label for="number">Phone Number</label>
                                        <input bind:value={form.number} type="tel" placeholder="Enter Number" required/>    
                                    </div>
                                    <div class="form-group">
                                        <label for="address">Address</label>
                                        <input bind:value={form.address} type="text" placeholder="Enter Address" required/>    
                                    </div>
                                    <div class="form-group">
                                        <label for="birthday">Birthday</label>
                                        <input bind:value={form.birthday} type="date" placeholder="Enter Birthday" required/>    
                                    </div>
                                    <div class="select-tags">
                                        <div class="form-group2">
                                            <label for="role">Role</label>
                                            <select bind:value={form.role} required>
                                                <option value="">Select Role</option>
                                                {#each rolesArray as role}
                                                    <option value={role.name}>{role.name}</option>
                                                {/each}
                                            </select>
                                        </div>
                                        <div class="form-group2">
                                            <label for="office">Office</label>
                                            <select bind:value={form.office} required>
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
                                            <button type="button" class="cancel" on:click={() => { form = {}; editId = null; }}>Cancel</button>
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
{/if}
