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

    const url = userRole === 'Admin'
        ? `${import.meta.env.VITE_BASE_URL}/tasks`
        : `${import.meta.env.VITE_BASE_URL}/tasks?userId=${userId}&role=${userRole}&office=${userOffice}`;

    const res = await fetch(url);
    const data = await res.json();

    const events = Array.isArray(data) ? data.map((task: TaskData) => ({
        id: task.id != null ? String(task.id) : undefined,
        title: userRole === 'Admin' 
            ? `${task.title} - ${task.assignedToName}` 
            : task.title,
        start: task.startDate,
        end: task.endDate,
        color: task.status === 'Completed' ? 'green' : (task.status === 'In Progress' ? 'blue' : (task.status === 'Pending' ? 'orange' : 'red')),
        extendedProps : {
            description: task.description,
            status: task.status,
            assignedToName: task.assignedToName,
            createdByName: task.createdByName
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
        eventClick: function (info) {
            const { title, extendedProps } = info.event;
            alert(`${title}\nDescription: ${extendedProps.description}\nStatus: ${extendedProps.status}`);
        }
    });
    calendar.render();

    // Update on window resize
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

<div bind:this={calendarEl} class="calendar-container"></div>

<style>
    .calendar-container {
        width: 100%;
        height: 73.5vh;
    }

    @media screen and (max-width: 700px) and (min-width: 300px) {
        .calendar-container {margin: 0;}
    }
</style>