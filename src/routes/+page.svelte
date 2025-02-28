<script lang="ts">
    import Login from './login/+page.svelte';
    import { isLoggedIn } from '../lib/mockData';
    
    function openForm(status: string) {
        alert(`Open form for: ${status}`); // Replace this with your modal logic
    }
</script>

{#if !$isLoggedIn}
    <Login />
{:else}
    <div class="container">
        <div class="main-container">
            <div class="dash-controls">
                <div class="task-card">
                    <span class="circle">1</span>
                    <span class="task-text">Pending</span>
                    <button class="add-btn" on:click={() => openForm('Pending')}>+</button>
                </div>
                <div class="task-card">
                    <span class="circle">2</span>
                    <span class="task-text">Ongoing</span>
                    <button class="add-btn" on:click={() => openForm('Ongoing')}>+</button>
                </div>
                <div class="task-card">
                    <span class="circle">3</span>
                    <span class="task-text">Completed</span>
                    <button class="add-btn" on:click={() => openForm('Completed')}>+</button>
                </div>
            </div>
            <slot /> 
        </div>
    </div>
{/if}

<style>
    /* .main-container {
        flex: 1;
        margin-left: 250px;
        padding: 20px;
        overflow-y: auto;
        background: #ffffff;
    } */

    .dash-controls {
        display: flex;
        gap: 10px;
        justify-content: space-evenly;
        margin-bottom: 20px;
        margin-top: 20px;
    }

    .task-card {
        width: 318px;
        display: flex;
        align-items: center;
        gap: 20px;
        background: #23BEDA;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
    }

    .task-card:hover {
        background: #1CA0C3;
    }

    .circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: white;
        color: black;
        font-weight: bold;
        font-size: 1.5rem;
        border-radius: 50%;
    }

    .task-text {
        flex: 1;
        font-size: 1.5rem;
    }

    .add-btn {
        background: white;
        color: #23BEDA;
        border: none;
        font-size: 1.2rem;
        font-weight: bold;
        padding: 5px 10px;
        border-radius: 50%;
        cursor: pointer;
        transition: 0.3s;
    }

    .add-btn:hover {
        background: #f0f0f0;
    }
</style>