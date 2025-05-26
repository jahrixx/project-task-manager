<script lang="ts">
    import { get, derived } from "svelte/store";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { user, isAuthenticated, type User } from "$lib/stores/user";

    export const activePage = derived(page, ($page) => $page.url.pathname);
    export const userRole = derived(user, ($user: User | null) => $user?.role || "");

    let isSidebarOpen = false;
    let lastScrollPosition = 0;
    let burgerVisible = true;

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }
    function logoutUser() {
        if (!user) {
            console.error("No user is currently logged in!");
            return;
        } 
            if (!confirm("Are you sure you want to logout?")) {
                return;
            }
        user.set(null);
        localStorage.removeItem("user");
        isAuthenticated.set(false);
        goto('/login');
    }
    function handleScroll() {
        const currentScrollPosition = window.pageYOffset;

        if(currentScrollPosition > lastScrollPosition && currentScrollPosition > 50) {
            burgerVisible = false;
        } else {
            burgerVisible = true;
        }
        lastScrollPosition = currentScrollPosition;
    }
    onMount(() => {
        const unsubscribe = user.subscribe($user => {
            if (!$user && get(isAuthenticated)) {
                goto('/login');
            }
        });
        window.addEventListener('scroll', handleScroll);

            return () => {
                unsubscribe();
                window.removeEventListener('scroll', handleScroll);
            } 
    });
</script>
<button type="button" class="burger" on:click={() => toggleSidebar()} aria-label="toggle-sidebar" class:visible={burgerVisible}>☰</button>
<div class="sidebar" class:show={isSidebarOpen}>
    <div class="logo-container">
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 192 192" enable-background="new 0 0 192 192" xml:space="preserve"><path fill="#000000" opacity="1.000000" stroke="none" d="M99.129028,18.989832 C140.827255,18.957966 174.290497,46.605125 182.011566,87.076912 C190.066956,129.301041 159.928879,173.171432 117.288086,181.291397 C70.655922,190.171448 26.391775,159.064896 19.954424,111.986198 C14.055673,68.846504 42.723637,28.030823 88.223671,19.871265 C91.645164,19.257689 95.179100,19.271076 99.129028,18.989832 M96.105545,125.538521 C95.409340,124.215698 94.862152,122.784767 93.993301,121.587204 C87.187119,112.206017 79.569443,104.128044 66.647415,104.337212 C63.597473,104.386574 62.061253,105.184227 62.136250,108.587967 C62.312824,116.602058 63.745834,124.405899 65.574570,132.159454 C65.998528,133.956955 66.735481,135.620926 68.834610,136.175064 C77.200302,138.383545 85.661629,139.902634 94.350822,139.869202 C96.282043,139.861771 97.624657,139.145798 97.594299,137.005539 C97.542984,133.386139 98.272644,129.675003 96.105545,125.538521 M139.858673,112.730705 C139.929977,112.068886 139.972961,111.402573 140.076996,110.745934 C141.035492,104.695480 140.825577,104.436974 134.838776,104.380836 C119.770348,104.239540 104.442520,120.234741 105.030258,135.271072 C105.163383,138.676971 106.348518,140.024368 109.795021,139.922791 C117.319389,139.701050 124.637527,138.276703 131.943710,136.660339 C134.651749,136.061218 136.235947,134.654953 136.839386,131.772369 C138.097855,125.760590 139.625153,119.806969 139.858673,112.730705 M62.241760,92.312943 C62.105621,94.630058 62.256283,96.464851 65.341034,96.918724 C78.454926,98.848244 97.087906,83.497536 97.626831,70.130188 C97.707222,68.136200 97.639854,66.135475 97.613724,64.138214 C97.589775,62.306828 96.721878,61.327831 94.808540,61.547520 C86.565880,62.493923 78.273506,63.029606 70.199959,65.224236 C67.382660,65.990067 65.992538,67.595413 65.420380,70.265678 C63.924107,77.248688 62.404530,84.226524 62.241760,92.312943 M112.143219,85.342125 C113.919502,87.086990 115.666862,88.862503 117.477470,90.570999 C123.030708,95.811066 129.672211,97.638512 137.178253,96.921165 C139.290222,96.719322 140.842529,96.193138 140.514236,93.711212 C139.473007,85.839088 139.069397,77.881432 136.893295,70.162430 C136.057312,67.197029 134.444092,65.869904 131.552734,65.083183 C123.981468,63.023090 116.192871,62.623638 108.487793,61.577351 C105.586731,61.183411 105.316460,62.963470 105.088982,65.184265 C104.313919,72.750610 106.522827,79.256927 112.143219,85.342125 M72.716354,35.466579 C73.616570,34.240414 74.516785,33.014252 75.723618,31.370434 C55.502861,36.449036 32.783279,62.664021 33.131870,74.226212 C41.204803,68.486885 49.832481,64.285255 58.761330,60.675621 C60.900322,59.810898 61.372540,57.770630 62.059330,55.928921 C64.687660,48.880806 68.139992,42.264149 72.716354,35.466579 M74.874535,169.255844 C69.347206,162.087097 65.379280,154.049194 62.035645,145.706284 C60.969803,143.046829 59.536907,141.194092 56.794800,140.200470 C47.760250,136.926666 39.341000,132.484726 31.053310,125.642578 C34.960957,137.295166 41.050083,146.372345 49.043449,153.910141 C56.458809,160.902878 64.278801,167.729660 74.874535,169.255844 M132.166412,162.548538 C130.518585,164.968750 128.870773,167.388977 127.222954,169.809189 C148.040146,162.128632 162.406540,148.102295 171.077286,126.489647 C166.311462,129.426620 162.931107,132.426468 158.986542,133.770706 C146.606476,137.989548 137.965286,145.533264 134.402283,158.398819 C134.056625,159.646896 133.154404,160.740845 132.166412,162.548538 M151.531250,45.959538 C144.318985,40.403389 137.519760,34.118454 127.110390,31.875822 C133.466263,40.605026 137.805511,49.165543 141.173599,58.218922 C141.681046,59.582855 142.526550,60.406109 143.865662,60.913807 C153.142151,64.430779 161.937744,68.891266 170.693130,75.276718 C167.026596,63.230881 159.938171,54.576115 151.531250,45.959538 M147.339005,109.766510 C146.567245,117.096138 145.795486,124.425758 145.004181,131.941116 C148.992157,131.705719 151.796799,129.747284 154.606918,128.087036 C162.705353,123.302399 170.279968,117.928444 173.966553,108.666428 C175.172134,105.637558 174.527466,104.304146 171.120667,104.353027 C164.624969,104.446243 158.125351,104.470741 151.630707,104.347824 C148.340958,104.285561 147.058411,105.743919 147.339005,109.766510 M56.959167,131.715927 C57.351440,125.436470 55.814846,119.345734 55.042225,113.190201 C53.935799,104.375259 53.784233,104.391312 44.833817,104.382309 C39.133129,104.376572 33.432434,104.381241 26.791277,104.381241 C32.319248,119.658615 43.274330,126.908661 56.959167,131.715927 M90.258072,172.295456 C92.316780,173.294968 94.285980,174.614288 97.531326,174.108734 C97.531326,165.900864 97.565445,157.659805 97.497513,149.419586 C97.486282,148.057068 96.377831,147.514038 95.079491,147.380920 C87.023087,146.554947 78.968437,145.711929 70.892662,144.872437 C70.774963,152.275711 79.643936,164.925339 90.258072,172.295456 M97.646072,31.939981 C97.474258,30.519045 98.086006,28.914625 96.714500,27.779928 C86.283073,28.888016 71.760780,44.979668 70.643463,56.981117 C78.944046,56.651497 87.021133,54.571476 95.283287,54.468292 C97.814041,54.436687 97.626610,52.096729 97.634384,50.276741 C97.659233,44.464828 97.646126,38.652756 97.646072,31.939981 M131.278397,56.959209 C132.645218,56.007183 131.845169,54.719387 131.462967,53.834717 C127.666458,45.046894 122.689247,37.067120 114.770615,31.367382 C112.162140,29.489832 109.444260,27.464371 105.896812,27.852369 C105.211159,30.663355 104.798576,49.257240 105.121788,51.815254 C105.387360,53.917084 106.525085,54.664318 108.447945,54.654610 C115.938095,54.616791 123.223709,56.525398 131.278397,56.959209 M148.323792,70.553085 C147.226562,70.526260 146.205231,69.474960 144.813446,70.429672 C145.436844,75.088417 145.659286,79.940308 146.832748,84.550125 C147.841446,88.512695 145.180359,93.844551 148.938751,96.218872 C152.422684,98.419800 157.396011,96.924805 161.698059,96.853554 C165.889664,96.784142 170.236389,97.802444 174.302628,96.002014 C174.497650,93.188660 173.228806,91.221947 172.029114,89.244759 C166.593094,80.285721 157.976151,75.302719 148.323792,70.553085 M115.062706,146.843216 C112.911407,147.003662 110.761711,147.192047 108.608276,147.315308 C107.026520,147.405838 105.374207,147.636719 105.297340,149.560257 C104.969505,157.763870 104.726128,165.975311 105.508331,174.212555 C116.280762,172.698898 131.274658,155.570801 131.697281,144.675949 C126.417191,145.331345 121.178825,145.981567 115.062706,146.843216 M55.733631,82.589180 C56.325844,78.548637 56.918056,74.508087 57.520092,70.400536 C46.163357,70.850563 28.831276,86.279404 28.143608,96.921570 C33.771839,96.921570 39.368675,96.921890 44.965515,96.921494 C53.812485,96.920868 53.818005,96.921471 55.063324,88.412521 C55.303291,86.772911 55.481178,85.124222 55.733631,82.589180 z"/></svg>
        <!-- <img src="/src/components/assets/logo.png" alt="Logo"> -->
        <h2 class="project-title">Project Task Manager</h2>
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
            <li>
                <button class:active={$activePage === '/calendar'} on:click={() => goto('/calendar')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg height="20px" width="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M22 14V12C22 11.161 22 10.4153 21.9871 9.75H2.0129C2 10.4153 2 11.161 2 12V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" fill="#000000"></path> <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z" fill="#000000"></path> </g></svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Task Calendar</p>
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
            <li>
                <button class:active={$activePage === '/calendar'} on:click={() => goto('/calendar')} >
                    <div style="display: flex; align-items: center; padding-top: 4px; margin: 0;">
                        <span style="margin-left: 2px;">
                            <svg height="20px" width="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M22 14V12C22 11.161 22 10.4153 21.9871 9.75H2.0129C2 10.4153 2 11.161 2 12V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" fill="#000000"></path> <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z" fill="#000000"></path> </g></svg>
                        </span>
                        <p style="padding: 5px 10px 5px 5px; margin: 0;">Task Calendar</p>
                    </div>
                </button>
            </li>
        {/if}
        <li><button class="btn-logout" on:click={logoutUser}><span>Logout</span></button></li>
    </ul>
</div>
<style>
    .burger {
        margin: 0;
        padding: 0;
        position: fixed;
        top: 0;
        left: 2px;
        width: 40px;
        height: 40px;
        background-color: #ff6b6b;
        transform: rotate(45deg) translate(10px) translateY(-10px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);
    }
    .burger.visible {
        transform: translateY(0);
    }
    .burger:not(.visible) {
        transform: translateY(-100%);
    }
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
    .sidebar .project-title {
        text-align: left;
        font-family: 'Times New Roman', Times, serif;
        font-size: 1.9rem;
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
        padding: 5px 8px;
        font-weight: bold;
        color: black;
        background-color: transparent;
        text-align: left;
        cursor: pointer;
        border: none;
        border-bottom: 1px solid black;
        transition: all 0.3s ease;
    }
    .sidebar button.active{
        background-color: #23BEDA;
        color: white;
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
        margin-bottom: 1.5rem;
        margin-top: 6px;
    }
    .logo-container h2 {
        text-align: left;
        font-size: 1.7rem;
        margin: 0;
        color: #333;
    }
    @media screen and (max-width: 700px) and (min-width: 300px) {
        .burger {
            display: block;
            font-size: 18px;
            cursor: pointer;
            top: 0;
            padding: 10px;
            padding-bottom: 45px;
            background-color: #333;
            color: aliceblue;
            border: none;
            z-index: 99999;
            position: fixed;
        }
        .sidebar {
            display: none;
            width: 100%;
            height: 95vh;
            background-color: #333;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 9999;
            overflow-y: hidden;
            overflow-x: hidden;
        }
        .logo-container h2 {
            text-align: left;
            font-size: 1rem;
            margin: 0;
            color: white;
        }
        .logo-container svg {
            width: 150px;
            height: 150px;
            margin: 0;
            padding: 0;
        }
        .logo-container {
            padding-top: 10px;
            padding-left: 40px;
            padding-right: 20px;
            padding-bottom: 0;
            margin-bottom: .5rem;
            margin-top: 1rem;
        }
        .logo-container svg path {
             fill: #fff;
        }
        .sidebar.show {
            display: block;
        }
        .sidebar button {
            float: none;
            display: block;
            width: 100%;
            border-radius: 0;
            transform: none;
            color: whitesmoke;
        }
        .sidebar .btn-logout > span {
            text-align: center;
        }
        .sidebar .btn-logout {
            background-color: red;
        }
    }
</style>