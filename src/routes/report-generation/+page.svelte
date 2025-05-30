<script lang="ts">
    import { onMount, afterUpdate, onDestroy, tick } from "svelte";
    import { writable, get } from "svelte/store";
    import { isAuthenticated, user, userRole, type User } from '$lib/stores/user';
    import { goto } from "$app/navigation";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    import ToastContainer from "../../components/ToastContainer.svelte";
    import "flatpickr/dist/flatpickr.min.css";
    import type { TaskData } from "$lib/stores/task";
    import flatpickr from "flatpickr";
    import type { Instance } from "flatpickr/dist/types/instance";

    const API_URL = `${import.meta.env.VITE_BASE_URL}`;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    
    type Report = {
        id: number;
        title: string;
        startDate: string;
        endDate: string;
        filePath: string;
    };
    let toasts: { id: number; type: string; message: string }[] = [];
    let reports = writable<Report[]>([]);
    let userList = writable<User[]>([]);
    let officeList = writable<{ id: number, officeName: string }[]>([]);
    let taskDates = writable<{ startDate: string, endDate: string }[]>([]);
    let activeReport = writable<{ id: number, title: string, startDate: string, endDate: string, generatedDate: string, tasks: TaskData[]} | null>(null);
    let selectedUser = "";
    let selectedOffice = "";
    let startDate = "";
    let endDate = "";
    let searchQuery = "";
    let calendarInstance: Instance | null = null;
    let now = new Date();
    let timeInterval: NodeJS.Timeout;

    onMount(async () => {
        if (!isAuthenticated) {
            goto('/login');
            return;
        }
        
        await Promise.all([fetchOffices(), fetchUsers(), fetchReports()]);
        initializeCalendar([]);

        if ($user) {
            fetchTaskDates(String($user?.id));
        }

        timeInterval = setInterval(() =>  {
            now = new Date();

        }, 1000);
    });

    onDestroy(() => {
        clearInterval(timeInterval);
    });

    $: if ($userRole === "Manager" && selectedUser) {
        fetchTaskDates(selectedUser);
    }

    async function fetchUsers() {
        const res = await fetch(`${API_URL}/users`);
        const allUsers = await res.json();
        const currentUser = get(user);

        if(selectedOffice === ""){
            userList.set(allUsers);
        }

        if(currentUser?.role === "Admin"){
            userList.set(allUsers);
        } else if(currentUser?.role === "Manager"){
            const filteredUsers = allUsers.filter((u: User) => u.office === currentUser.office || u.id === currentUser.id);
            userList.set(filteredUsers);
        } else {
            if (currentUser) {
                userList.set([currentUser]);
                selectedUser = String(currentUser.id);
            }
        }
    }

    async function fetchReports() {
        const res = await fetch(`${API_URL}/reports?userId=${selectedUser}&startDate=${startDate}&endDate=${endDate}&office=${selectedOffice}`);
        reports.set(await res.json());
    }

    async function fetchOffices() {
        const res = await fetch(`${API_URL}/offices`);
        officeList.set(await res.json());
    }

    async function fetchTaskDates(userId: string) {
        if (!userId) {
            taskDates.set([]);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/reports/tasks?assignedTo=${userId}`);
            const tasks = await res.json();

            if (!tasks || tasks.length === 0) {
                taskDates.set([]);
                initializeCalendar([]);
                showToast ({
                    type: "error",
                    message: "No Tasks Assigned For This User."
                });
                return;
            }

            const formattedTasks = tasks.map((task: TaskData) => ({
                startDate: new Date(task.startDate).toLocaleDateString("en-CA"),
                endDate: new Date(task.endDate).toLocaleDateString("en-CA"),
            }));

            console.log("Tasks of the Selected User: ",formattedTasks)
            taskDates.set(formattedTasks);
            await tick();
            initializeCalendar(formattedTasks);
        } catch (error) {
            console.error("Error fetching task dates:", error);
            taskDates.set([]);
            initializeCalendar([]);
        }
    }

    function showToast({ type, message }: { type: string; message: string }) {
        const id = Date.now();
        toasts = [...toasts, { id, type, message }];
        setTimeout(() => {
            toasts = toasts.filter((toast) => toast.id !== id);
        }, 5000);
    }

    function initializeCalendar(taskDateRanges: { startDate: string, endDate: string }[]) {
        let highlightedDates: string[] = [];
        console.log("Task Dates: ", taskDateRanges);
        
        let allStartDates = taskDateRanges.map(task => new Date(task.startDate));
        let allEndDates = taskDateRanges.map(task => new Date(task.endDate));
        
        let minDate = new Date(Math.min(...allStartDates.map(date => date.getTime())));
        let maxDate = new Date(Math.max(...allEndDates.map(date => date.getTime())));
        
        taskDateRanges.forEach(({ startDate, endDate }) => {
            let currentDate = new Date(startDate);
            let end = new Date(endDate);

            while (currentDate <= end) {
                highlightedDates.push(new Date(currentDate).toLocaleDateString("en-CA"));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        if (calendarInstance) {
            calendarInstance.destroy();
            calendarInstance = null;
        }

        calendarInstance = flatpickr(document.getElementById("datePicker") as HTMLInputElement, {
            mode: "range",
            dateFormat: "Y-m-d",
            disableMobile: true,
            minDate: minDate,
            maxDate: maxDate,
            onChange: (selectedDates) => {
                if (selectedDates.length === 2) {
                    startDate = selectedDates[0].toLocaleDateString("en-CA");
                    endDate = selectedDates[1].toLocaleDateString("en-CA");
                    console.log("Selected Date Range:", startDate, "to", endDate);

                    const selectedRangeHasGaps = !selectedDates.every(date => 
                        highlightedDates.includes(date.toLocaleDateString("en-CA"))
                    );

                    if(selectedRangeHasGaps){
                        alert("Selection Includes Date With No Tasks!");
                        calendarInstance?.clear();
                        return;
                    }
                }
            },
            onDayCreate: function(_, __, ___, dayElem) {
                const dateStr = dayElem.dateObj.toLocaleDateString("en-CA");
                if (highlightedDates.includes(dateStr)) {
                    dayElem.style.backgroundColor = "lightgreen";
                    dayElem.style.color = "black";
                    dayElem.style.borderRadius = "50%";
                    dayElem.style.fontSize = "12px";
                } else {
                    dayElem.style.backgroundColor = "#FF7F7F";
                    dayElem.style.color = "black";
                    dayElem.style.borderRadius = "50%";
                    dayElem.style.fontSize = "12px";
                    dayElem.style.cursor = "not-allowed";
                }
            }
        });
    }

    async function generateReport() {
        console.log("Requesting:", `${API_URL}/reports/generate`);
        try {
            const res = await fetch(`${API_URL}/reports/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, userId: selectedUser })
            });
            
            if (res.ok) {
                const data = await res.json();
                console.log("Report Generated: ", data);
                alert("Report Generated Successfully!")

                activeReport.set({
                    id: data.reportId,
                    title: `Task Report - ${startDate} to ${endDate}`,
                    startDate,
                    endDate,
                    generatedDate: formattedDate,
                    tasks: data.tasks as TaskData[]
                });

                fetchReports();
            } else {
                alert("Failed To Generate Report!")
            }
        } catch (error) {
            console.error("Error: ", error);
            alert("An Error Occured While Generating The Report!")
        }
    }

    async function downloadReport(reportId: number, startDate: string, endDate: string) {
        console.log("Report ID:", reportId);
        console.log("Selected Start Date:", startDate);
        console.log("Selected End Date:", endDate);

        if (!startDate || !endDate) {
            console.error("Start date and end date are required.");
            return;
        }
        
        const res = await fetch(`${API_URL}/reports/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reportId, startDate, endDate, downloaderId: $user?.id  }),
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Task_Report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            console.error("Failed to download report", await res.json());
        }
    }

    function printReport() {
        const printContent = document.querySelector('.print-area');
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        iframe.onload = () => {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if(!doc) return;
            
            const style = `
                <style>
                    body{ font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { margin-bottom: 20px; }
                    .report-meta { display: flex; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
                    .report-logo { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .user-info { text-align: left; }
                    .task-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .task-table th, .task-table td { padding: 8px; border: 1px solid #ddd; }
                    .task-table th { background-color: #f2f2f2; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            `;

            doc.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1.0">` + style;
            doc.body.innerHTML = printContent.innerHTML;

            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => document.body.removeChild(iframe), 500);
            }, 300);
        }
    }

    // function printReport() {
    //     const printContent = document.querySelector('.print-area');
    //         if (!printContent) return;

    //     const printWindow = window.open('', '_blank', 'width=800,height=600');
    //         if(!printWindow) return;

    //         printWindow?.document.head.insertAdjacentHTML('beforeend',
    //             `<style>
    //                 body { font-family: Arial, sans-serif; margin: 20px; }
    //                 .report-header { margin-bottom: 20px; }
    //                 .report-meta { display: flex; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
    //                 .report-logo { display: flex; justify-content: space-between; margin-bottom: 20px; }
    //                 .logo { font-size: 24px; font-weight: bold; }
    //                 .user-info { text-align: left; }
    //                 .task-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    //                 .task-table th, .task-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    //                 .task-table th { background-color: #f2f2f2; }
    //             </style>`
    //         );
    //         printWindow?.document.body.insertAdjacentHTML('beforeend',printContent.innerHTML);
    //         printWindow?.document.close();
    //         printWindow?.focus();
    //         setTimeout(() => {
    //             printWindow?.print();
    //             printWindow?.close();
    //         }, 500);
    // }

    function filterUsersByOffice() {
        if(!selectedOffice) return get(userList);
        return get(userList).filter(user => user.office === selectedOffice);
    }
    
    function clearInputs() {
        activeReport.set(null);
        selectedUser = "";
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            (datePicker as HTMLInputElement).value = '';
        }
    }
</script>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/report-generation.css">
    <title>Report Generation</title>
</head>
{#if !isAuthenticated}
    <Login />
{:else}
    <div class="container">
        <Sidebar />
        <div class="main-container">
            <UserProfile />
            <h2 class="h2"><u>Generate Report</u></h2>
            <div class="report-container">
                <div class="report-fields">
                    {#if $userRole === "Admin"}
                        <div class="form-group">
                            <label for="office">Select Office</label>
                            <select bind:value={selectedOffice} on:change={fetchUsers}>
                                <option value="" disabled selected>Select an office...</option>
                                <!-- <option>All Offices</option> -->
                                {#each $officeList as office}
                                    <option value={office.officeName}>{office.officeName}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="search">Select User</label>
                            <select bind:value={selectedUser} on:change={() => fetchTaskDates(selectedUser)}>
                                {#each filterUsersByOffice().filter(user =>
                                    (user.firstName ?? "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                                    (user.lastName ?? "").toLowerCase().includes(searchQuery.toLowerCase().trim())
                                ) as user}
                                    <option value={user.id}>{user.firstName} {user.lastName} - {user.role}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="datePicker">Select Date Range</label>
                            <input id="datePicker" type="text" placeholder="Select Date Range" required />
                        </div>
                
                    {:else if $userRole === "Manager"}
                        <div class="form-group">
                            <label for="manager">Manager</label>
                            <input type="text" value="{$user?.firstName} {$user?.lastName}" readonly />
                        </div>
                        <div class="form-group">
                            <label for="search">Select Employee</label>
                            <select bind:value={selectedUser} on:change={() => fetchTaskDates(selectedUser)}>
                                <option value={$user?.id}>
                                    {$user?.firstName} {$user?.lastName} (Manager)
                                </option>
                                
                                {#each $userList.filter(emp => emp.office === $user?.office && emp.role === "Employee") as emp}
                                    <option value={emp.id}>{emp.firstName} {emp.lastName} - {emp.role}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="datePicker">Select Date Range</label>
                            <input id="datePicker" type="text" placeholder="Select Date Range" required />
                        </div>
                    {:else} 
                        <div class="form-group">
                            <label for="employee">Employee</label>
                            <input type="text" value="{$user?.firstName} {$user?.lastName}" readonly />
                        </div>
                        <div class="form-group">
                            <label for="datePicker">Select Date Range</label>
                            <input id="datePicker" type="text" placeholder="Select Date Range" required />
                        </div>
                    {/if}
                </div>
                <div class="report-actions">
                        {#if selectedUser && $taskDates.length === 0}
                            <ToastContainer {toasts} />
                            <!-- <span><p style="color: red;">No Tasks Assigned For This User.</p></span> -->
                        {/if}
                    <div class="buttons">
                        <button class="generate-btn" on:click={generateReport}>Generate Report</button>
                        <button class="clear-btn" on:click={clearInputs}>Reset</button>
                    </div>
                </div>
            </div>
            {#if $activeReport}
                <div class="controls-container">
                    <div class="report-controls">
                        <button aria-label="download-report" class="control-btn download" on:click={() => downloadReport($activeReport.id, $activeReport.startDate, $activeReport.endDate)}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#1C274C"/>
                                <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#1C274C"/>
                            </svg>
                        </button>
                        <button aria-label="print-report" class="control-btn print" on:click={printReport}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 7H7V6h10v1zm0 12H7v-6h10v6zm2-12V3H5v4H1v8.996C1 17.103 1.897 18 3.004 18H5v3h14v-3h1.996A2.004 2.004 0 0 0 23 15.996V7h-4z" fill="#000000"/></svg>
                        </button>
                    </div>
                </div>
            {/if}
            <div class="">

            </div>
            {#if !$activeReport}
                <div class="banner">
                    <div class="report-controls">
                        <button aria-label="download-report" class="control-btn download" style="cursor: not-allowed;">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#1C274C"/>
                                <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#1C274C"/>
                            </svg>
                        </button>
                        <button aria-label="print-report" class="control-btn print" style="cursor: not-allowed;">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 7H7V6h10v1zm0 12H7v-6h10v6zm2-12V3H5v4H1v8.996C1 17.103 1.897 18 3.004 18H5v3h14v-3h1.996A2.004 2.004 0 0 0 23 15.996V7h-4z" fill="#000000"/></svg>
                        </button>
                    </div>
                </div>
            {/if}
            <div class="report-display">
                <div class="report-content print-area">
                <div class="report-header">
                    <h2>
                        {#if $activeReport}
                            {$activeReport.title}
                        {:else}
                            Task Completion Report
                        {/if}
                    </h2>
                    <div class="report-meta">
                        <span>
                            Generated on: 
                            {#if $activeReport}
                                {$activeReport.generatedDate}
                            {:else}
                                {formattedDate} at {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            {/if}
                        </span>
                        <span>
                            Date range: 
                            {#if $activeReport}
                                {$activeReport.startDate} to {$activeReport.endDate}
                            {:else}
                                mm/dd/yyyy to mm/dd/yyyy
                            {/if}
                        </span>
                    </div>
                </div>
                <!-- <div class="report-content print-area"> -->
                    <div class="report-logo">
                        <div class="logo">Report Generated By:</div>
                        <div class="user-info-reports">
                            <div class="user-name">
                                {#if $activeReport}
                                        {$user?.firstName} {$user?.lastName}
                                {:else}
                                    User Full Name
                                {/if}
                            </div>
                            <div class="user-role">
                                {#if $activeReport}
                                    {$user?.role}
                                {:else}
                                    User Role
                                {/if}
                            </div>
                        </div>  
                    </div>
                    {#if $activeReport}
                        {#if $activeReport.tasks && $activeReport.tasks.length > 0}
                            <table class="task-table">
                                <thead>
                                    <tr>
                                        <th>Task ID</th>
                                        <th>Title</th>
                                        <th>Assigned To</th>
                                        <th>Created By</th>
                                        <th>Office</th>
                                        <th>Description</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each $activeReport.tasks as task}
                                        <tr>
                                            <td>{task.id}</td>
                                            <td>{task.title}</td>
                                            <td>{task.assignedToName}</td>
                                            <td>{task.createdByName}</td>
                                            <td>{task.office}</td>
                                            <td>{task.description}</td>
                                            <td>{new Date(task.startDate).toLocaleDateString()}</td>
                                            <td>{new Date(task.endDate).toLocaleDateString()}</td>
                                            <td>{task.status}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="no-tasks">No Tasks Found For This Date Range.</div>
                        {/if}
                    {:else}
                        <div class="placeholder-content">
                            <div class="placeholder-text">Generated Report Will Appear Here!</div>
                            <div class="placeholder-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Task ID</th>
                                            <th>Title</th>
                                            <th>Assigned To</th>
                                            <th>Created By</th>
                                            <th>Office</th>
                                            <th>Description</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                            <td>--</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}