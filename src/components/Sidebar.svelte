<script lang="ts">
    import { get, derived } from "svelte/store";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { user, isAuthenticated, type User } from "$lib/stores/user";

    export const activePage = derived(page, ($page) => $page.url.pathname);
    export const userRole = derived(user, ($user: User | null) => $user?.role || "");
    
    function logoutUser() {
        user.set(null);
        localStorage.removeItem("user");
        isAuthenticated.set(false);
        goto('/login');
    }

    onMount(() => {
        const unsubscribe = user.subscribe($user => {
            console.log("Current User:", $user);

            if (!$user && get(isAuthenticated)) {
                goto('/login');
            }
        });

        return () => unsubscribe(); // Cleanup subscription
    });
</script>

<div class="sidebar">
    <div class="logo-container">
        <img src="/src/components/assets/logo.png" alt="Logo">
        <h2>Project Task Manager</h2>
    </div>    
    <ul>
        <li>
            <button class:active={$activePage === '/dashboard'} on:click={() => goto('/dashboard')}>
                <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                    <span style="margin-left: 2px;">
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48">
                            <path d="M39.5,43h-9c-1.381,0-2.5-1.119-2.5-2.5v-9c0-1.105-0.895-2-2-2h-4c-1.105,0-2,0.895-2,2v9c0,1.381-1.119,2.5-2.5,2.5h-9	C7.119,43,6,41.881,6,40.5V21.413c0-2.299,1.054-4.471,2.859-5.893L23.071,4.321c0.545-0.428,1.313-0.428,1.857,0L39.142,15.52	C40.947,16.942,42,19.113,42,21.411V40.5C42,41.881,40.881,43,39.5,43z">
                            </path>
                        </svg>
                    </span>
                    <p style="padding: 5px 10px 5px 5px; margin: 0;">Dashboard</p>
                </div>
            </button>
        </li>
        {#if $userRole === 'Admin'}
            <li>
                <button class:active={$activePage === '/user-management'} on:click={() => goto('/user-management')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg width="17px" height="17px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.5 6.5C1.5 3.46243 3.96243 1 7 1C10.0376 1 12.5 3.46243 12.5 6.5C12.5 9.53757 10.0376 12 7 12C3.96243 12 1.5 9.53757 1.5 6.5Z" fill="#000000"/>
                                <path d="M14.4999 6.5C14.4999 8.00034 14.0593 9.39779 13.3005 10.57C14.2774 11.4585 15.5754 12 16.9999 12C20.0375 12 22.4999 9.53757 22.4999 6.5C22.4999 3.46243 20.0375 1 16.9999 1C15.5754 1 14.2774 1.54153 13.3005 2.42996C14.0593 3.60221 14.4999 4.99966 14.4999 6.5Z" fill="#000000"/>
                                <path d="M0 18C0 15.7909 1.79086 14 4 14H10C12.2091 14 14 15.7909 14 18V22C14 22.5523 13.5523 23 13 23H1C0.447716 23 0 22.5523 0 22V18Z" fill="#000000"/>
                                <path d="M16 18V23H23C23.5522 23 24 22.5523 24 22V18C24 15.7909 22.2091 14 20 14H14.4722C15.4222 15.0615 16 16.4633 16 18Z" fill="#000000"/>
                            </svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">User Management</p>
                    </div>
                </button>
            </li>
            <li>
                <button class:active={$activePage === '/task-management'} on:click={() => goto('/task-management')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg version="1.1" id="svg2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 1200 1200" enable-background="new 0 0 1200 1200" xml:space="preserve">
                                <path id="path23237" d="M0,131.213v234.375h1200V131.213H0z M752.856,189.222h385.62v118.359h-385.62V189.222L752.856,189.222z M0,482.849v234.375h1200V482.85L0,482.849L0,482.849z M487.72,540.857h650.757v118.358H487.72V540.857L487.72,540.857z M0,834.412v234.375h1200V834.412H0z M894.946,892.42h243.529v118.359H894.946V892.42L894.946,892.42z"/>
                            </svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Task Management</p>
                    </div>
                </button>
            </li>
            <li>
                <button class:active={$activePage === '/report-generation'} on:click={() => goto('/report-generation')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg height="20px" width="20px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="#000000">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#FFFFFF;} </style> 
                                    <g> 
                                        <path d="M28,14H14c-1.1,0-2-0.9-2-2s0.9-2,2-2h1h13c0.6,0,1-0.4,1-1s-0.4-1-1-1H15h-1H7C5.9,8,5,7.1,5,6s0.9-2,2-2h14 c0.6,0,1-0.4,1-1s-0.4-1-1-1H7C4.8,2,3,3.8,3,6v15c0,2.2,1.8,4,4,4h3v2c0,2.2,1.8,4,4,4h14c0.6,0,1-0.4,1-1V15 C29,14.4,28.6,14,28,14z"></path> 
                                        <path d="M28,11H14c-0.6,0-1,0.4-1,1s0.4,1,1,1h14c0.6,0,1-0.4,1-1S28.6,11,28,11z"></path> 
                                        <path d="M21,5H7C6.4,5,6,5.4,6,6s0.4,1,1,1h14c0.6,0,1-0.4,1-1S21.6,5,21,5z"></path> 
                                    </g> 
                                </g>
                            </svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Report Generation</p>
                    </div>
                </button>
            </li>
        {/if}
        {#if $userRole === 'Manager' || $userRole === 'Employee'}
            <li>
                <button class:active={$activePage === '/task-management'} on:click={() => goto('/task-management')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg version="1.1" id="svg2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 1200 1200" enable-background="new 0 0 1200 1200" xml:space="preserve">
                                <path id="path23237" d="M0,131.213v234.375h1200V131.213H0z M752.856,189.222h385.62v118.359h-385.62V189.222L752.856,189.222z M0,482.849v234.375h1200V482.85L0,482.849L0,482.849z M487.72,540.857h650.757v118.358H487.72V540.857L487.72,540.857z M0,834.412v234.375h1200V834.412H0z M894.946,892.42h243.529v118.359H894.946V892.42L894.946,892.42z"/>
                            </svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Task Management</p>
                    </div>
                </button>
            </li>
            <li>
                <button class:active={$activePage === '/report-generation'} on:click={() => goto('/report-generation')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg height="20px" width="20px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="#000000">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#FFFFFF;} </style> 
                                    <g> 
                                        <path d="M28,14H14c-1.1,0-2-0.9-2-2s0.9-2,2-2h1h13c0.6,0,1-0.4,1-1s-0.4-1-1-1H15h-1H7C5.9,8,5,7.1,5,6s0.9-2,2-2h14 c0.6,0,1-0.4,1-1s-0.4-1-1-1H7C4.8,2,3,3.8,3,6v15c0,2.2,1.8,4,4,4h3v2c0,2.2,1.8,4,4,4h14c0.6,0,1-0.4,1-1V15 C29,14.4,28.6,14,28,14z"></path> 
                                        <path d="M28,11H14c-0.6,0-1,0.4-1,1s0.4,1,1,1h14c0.6,0,1-0.4,1-1S28.6,11,28,11z"></path> 
                                        <path d="M21,5H7C6.4,5,6,5.4,6,6s0.4,1,1,1h14c0.6,0,1-0.4,1-1S21.6,5,21,5z"></path> 
                                    </g> 
                                </g>
                            </svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Report Generation</p>
                    </div>
                </button>
            </li>
        {/if}
        <li><button class="btn-logout" on:click={logoutUser}>Logout</button></li>
    </ul>
</div>

<style> 
    .sidebar {
        width: 250px;
        height: 100vh;
        background-color: #fff;
        color: black;
        position: fixed;
        left: 0;
        top: 0;
        box-shadow: 10px 0 10px rgba(0, 0, 0, 0.3);
    }

    .sidebar h2 {
        text-align: center;
        margin-bottom: 20px;
    }

    .sidebar ul {
        padding: 0;
        margin: 0;
        width: 100%;
    }

    .sidebar ul li {
        margin: 0;
        width: 100%;
    }

    .sidebar button {
        width: 100%;
        display: block;
        /* padding: 10px 20px; */
        font-weight: bold;
        color: black;
        background-color: transparent;
        text-align: left;
        cursor: pointer;
        border: none;
        border-bottom: 1px solid black;
    }

    .sidebar button:hover {
        background-color: #23BEDA;
        color: white;
    }

    .sidebar button svg path{
        fill: currentColor;
    }

    .sidebar .btn-logout {
        width: 50%;
        padding: 12px;
        background-color: #23BEDA;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 20px;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.1s ease;
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
    }

    .sidebar .btn-logout:hover {
        opacity: 65%;
        background-color: darkred;
        text-align: center;
        color: white;
    }

    .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 25px 20px 0px;
        margin-bottom: 2rem;
        margin-top: 6px;
    }

    .logo-container img {
        width: 80px;
        height: 80px;
    }

    .logo-container h2 {
        text-align: left;
        font-size: 1.7rem;
        margin: 0;
        color: #333;
    }


</style>