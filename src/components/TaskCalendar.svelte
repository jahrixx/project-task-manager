<script lang="ts">
import { onMount } from 'svelte';
import { Calendar } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { user } from '$lib/stores/user';
import { get } from 'svelte/store';
import type{ TaskData } from '$lib/stores/task';
import { showToast } from '$lib/api/toastService';
import ToastContainer from './ToastContainer.svelte';

let calendarEl: any;
let loading = true;
const API_URL = `${import.meta.env.VITE_BASE_URL}`;

function getStatusColor(status: string) {
    const statusMaps: Record<string, string> = { 
        'completed': '#355E3B', 
        'in progress': '#00008B', 
        'pending': '#FFA500', 
        'overdue': '#C41E3A' };
    return statusMaps[status.toLocaleLowerCase()] || '#36454F';
}

onMount(async () => {
    const currentUser = get(user);
    const userId = currentUser?.id ?? 0;
    const userRole = currentUser?.role || '';  
    const userOffice = currentUser?.office || '';  
    const url = userRole === 'Admin'
        ? `${API_URL}/tasks`
        : `${API_URL}/tasks?userId=${userId}&role=${userRole}&office=${userOffice}`;

    const res = await fetch(url);
    const data = await res.json();

    const events = Array.isArray(data) ? data.map((task: TaskData) => ({
        id: task.id != null ? String(task.id) : undefined,
        title: userRole === 'Admin' 
            ? `${task.title} - ${task.assignedToName}` 
            : task.title,
        start: task.startDate,
        // end: task.endDate,
        end: new Date(new Date(task.endDate).getTime() + 86400000).toISOString().split('T')[0],
        color: task.status === 'Completed' ? 'green' : 
           task.status === 'In Progress' ? 'blue' : 
           task.status === 'Pending' ? 'orange' : 'red',
        extendedProps : {
            description: task.description,
            status: task.status,
            assignedToName: task.assignedToName,
            createdByName: task.createdByName,
            endDate: task.endDate
        }
    })) : [];

    const isMobile = window.innerWidth <= 500;
    
    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth', 
        headerToolbar: {
            left: isMobile ? 'prev,today,next' : 'prev,next today',
            center: 'title',
            right: isMobile ? '' : 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        buttonText: {
            today: isMobile ? 'Now' : 'Today',
            prev: isMobile ? '◀' : 'Prev',
            next: isMobile ? '▶' : 'Next',
            dayGridMonth: isMobile ? 'Month' : 'Month',
            dayGridWeek: isMobile ? 'Week' : 'Week',
            dayGridDay: isMobile ? 'Day' : 'Day'
        },
        events,
        eventContent: function (args) {
            const { event, view } = args;
            const { title, extendedProps } = event;

            let html = `<div style="padding: 7px 5px 1.5px; font-weight: bold; font-size: .9rem; color: #B2FFFF; white-space: normal; word-wrap: break-word;">${title}</div>`;

            if (view.type === 'dayGridWeek') {
                html += `<div style="font-size: 0.8rem; white-space: normal; word-wrap: break-word; color: #F0F8FF; padding: 7px;">${extendedProps.description}</div>`;
            }

            if (view.type === 'dayGridDay') {
                html += `
                    <div style="font-size: 0.78rem; color: #333; background-color: #f9f9f9; border-left: 4px solid #073980; padding: 6px 8px; margin-top: 6px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="margin-bottom: 4px;"><strong style="color: #1f2937;">Description:</strong> ${extendedProps.description || ''}</div>
                        <div style="margin-bottom: 4px;"><strong style="color: #1f2937;">Created by:</strong> ${extendedProps.createdByName || ''}</div>
                        <div style="margin-bottom: 4px;"><strong style="color: #1f2937;">Assigned to:</strong> ${extendedProps.assignedToName || ''}</div>
                        <div style="margin-bottom: 4px;"><strong style="color: #1f2937;">Status:</strong> <span style="text-transform: capitalize;">${extendedProps.status || ''}</span></div>
                        <div><strong style="color: #1f2937;">End Date:</strong> ${extendedProps.endDate || ''}</div>
                    </div>`;
            }
            return { html };
        },
        eventClick: function (info) {
            const { title, extendedProps } = info.event;
            showToast({ 
                type: "info", 
                message: `
                    <div style="padding-right: 20px;">
                        <span><strong><u>${title}</u></strong><span><br>
                        <span style="display: inline-block; max-width: 320px; word-break: break-word; white-space: normal;"><strong>Description:</strong> ${extendedProps.description}</span><br>
                        <strong>Status:</strong><span style="color: ${getStatusColor(extendedProps.status)}; text-transform: capitalize;"> ${extendedProps.status}</span><br>
                    </div>
                `
            });
        }
    });
    calendar.render();

    window.addEventListener('resize', () => {
        const mobile = window.innerWidth <= 500;
        calendar.setOption('headerToolbar', {
            left: mobile ? 'prev,next' : 'prev,next today',
            center: 'title',
            right: mobile ? '' : 'dayGridMonth,dayGridWeek'
        });
        calendar.setOption('buttonText', {
            today: mobile ? 'Now' : 'Today',
            prev: mobile ? '◀' : 'Prev',
            next: mobile ? '▶' : 'Next'
        });
    });
});
</script>
<head>
    <link rel="stylesheet" href="src/components/assets/css/calendar.css">
</head>
    <ToastContainer />
    <div class="calendar-container" bind:this={calendarEl}>
        {#if loading}
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading Task Calendar...</div>
            </div>
        {/if}
    </div>
<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        gap: 1rem;
    }

    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        font-size: 1rem;
        color: #555;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>