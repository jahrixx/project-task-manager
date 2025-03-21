<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { goto } from "$app/navigation";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    type Report = {
        id: number;
        title: string;
        startDate: string;
        endDate: string;
        filePath: string;
    };
    
    let reports = writable<Report[]>([]);
    let userList = writable<User[]>([]);
    let officeList = writable<{ id: number, officeName: string }[]>([]);
    let taskDates = writable<{ startDate: string, endDate: string }[]>([]);
    
    let startDate = "";
    let endDate = "";
    let selectedUser = "";
    let selectedOffice = ""; // Store office ID instead of name
    let searchQuery = "";

    onMount(async () => {
        if (!isAuthenticated) {
            goto('/login');
            return;
        }
        await fetchOffices();
        await fetchUsers();
        await fetchReports();
    });

    async function fetchReports() {
        const res = await fetch(`${API_URL}/reports?userId=${selectedUser}&startDate=${startDate}&endDate=${endDate}&office=${selectedOffice}`);
        reports.set(await res.json());
    }

    async function fetchUsers() {
        const res = await fetch(`${API_URL}/users`);
        userList.set(await res.json());
    }

    async function fetchOffices() {
        const res = await fetch(`${API_URL}/offices`);
        officeList.set(await res.json());
    }

    async function fetchTaskDates(userId: string) {
        const res = await fetch(`${API_URL}/tasks?userId=${userId}`);
        taskDates.set(await res.json());
    }

    async function generateReport() {
        const res = await fetch(`${API_URL}/reports/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, userId: selectedUser })
        });
        if (res.ok) fetchReports();
    }

    async function downloadReport(reportId: number) {
        const res = await fetch(`${API_URL}/reports/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reportId })
        });
        if (res.ok) {
            const data = await res.json();
            window.open(data.filePath, "_blank");
        }
    }

    function filterUsersByOffice() {
        if(!selectedOffice) return $userList;
        return $userList.filter(user => user.office === selectedOffice);
    }
</script>

<title>Reports Generation</title>
{#if !isAuthenticated}
    <Login />
{:else}
    <div class="container">
        <Sidebar />
        <div class="main-container">
            <UserProfile />
            <h2>Generate Report</h2>
            <div class="report-container">
                <div class="form-group">
                    <label for="office">Select Office</label>
                    <select bind:value={selectedOffice} on:change={fetchUsers}>
                        <option value="">All Offices</option>
                        {#each $officeList as office}
                            <option value={office.officeName}>{office.officeName}</option> <!-- Use office.id -->
                        {/each}
                    </select>
                </div>
                <div class="form-group">
                    <label for="search">Search User:</label>
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
                    <label for="start-date">Start Date</label>
                    <input bind:value={startDate} type="date" required />    
                </div>
                <div class="form-group">
                    <label for="end-date">End Date</label>
                    <input bind:value={endDate} type="date" required />    
                </div>
                <button on:click={generateReport}>Generate Report</button>
            </div>
            <div class="report-generation">
                <h3>Generated Reports</h3>
                <ul>
                    {#each $reports as report}
                        <li>
                            {report.title} ({report.startDate} - {report.endDate})
                            <button on:click={() => downloadReport(report.id)}>Download</button>
                            <button on:click={() => window.print()}>Print</button>
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
{/if}

<style>
    h2 {
        margin-left: 50px;
    }
    
    h3 {
        margin-left: 50px;
    }

    .main-container {
        margin-left: 250px;
    }

    .report-container {
        margin-left: 250px;
    }
</style>
