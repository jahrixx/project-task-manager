<script lang="ts">
import { onMount } from 'svelte';
import { Calendar } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { user } from '$lib/stores/user';
import { get } from 'svelte/store';
import type{ TaskData } from '$lib/stores/task';

let calendarEl: any;

onMount(async () => {
    const currentUser = get(user);
    const userId = currentUser?.id ?? 0;
    const userRole = currentUser?.role || '';  
    const userOffice = currentUser?.office || '';  

    const res = await fetch(`http://localhost:3000/tasks?userId=${userId}&role=${userRole}&office=${userOffice}`);
    const data = await res.json();

    const events = Array.isArray(data) ? data.map((task: TaskData) => ({
        id: task.id != null ? String(task.id) : undefined,
        title: task.title,
        start: task.startDate,
        end: task.endDate,
        color: task.status === 'Completed' ? 'green' : task.status === 'Pending' ? 'orange' : 'blue',
        extendedProps : {
            description: task.description,
            status: task.status,
            assignedToName: task.assignedToName,
            createdByName: task.createdByName
        }
    })) : [];
    
    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth', 
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events,
        eventClick: function (info) {
            const { title, extendedProps } = info.event;
            alert(`${title}\nDescription: ${extendedProps.description}\nStatus: ${extendedProps.status}`);
        }
    });
    calendar.render();
});
</script>

<div bind:this={calendarEl} class="calendar-container"></div>

<style>
    .calendar-container {
        width: 100%;
        height: 73.5vh;
    }
</style>