<script lang="ts">
    import { onMount } from "svelte";
    export let activities: { message: string, date: string, userFullname: string }[] = [];
    export let role: string;
    let loading = true;

    onMount(async () => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));    
        } catch (error) {
            console.error("Error waiting for 1 second:", error);
        } finally {
            loading = false;
        }
    })

    function formatDateTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const yesterday = new Date();
        const today = new Date();

        today.setDate(now.getDate());
        yesterday.setDate(now.getDate() - 1);

        if(date.toDateString() === yesterday.toDateString()){
            return `Yesterday, ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })}`;
        } else if(date.toDateString() === now.toDateString()){
            return `Today, ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })}`;
        } else {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        }
    }

</script>
<link rel="stylesheet" href="src/components/assets/css/recent-activities.css">
<div class="recent-activities">
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading Recent Activities...</div>
        </div>
    {:else}
        {#if activities.length > 0}
            <ul> 
                {#each activities as activity, index (activity.date+'-'+index)}
                    <li>
                        {#if role === 'Admin'}
                            <div class="activity-item">
                                <div style="width: 180px;">
                                    <p><b>{formatDateTime(activity.date)}</b></p>
                                </div>
                                <div>
                                    <p><b><i>{activity.userFullname}</i></b> {@html activity.message}</p>
                                </div>
                            </div>
                        {:else if role === 'Manager'}
                            <div class="activity-item">
                                <div style="width: 180px;">
                                    <p><b>{formatDateTime(activity.date)}</b></p>
                                </div>
                                <div>
                                    <p><b><i>{activity.userFullname}</i></b> {@html activity.message}</p>
                                </div>
                            </div>
                        {:else if role === 'Employee'}
                            <div class="activity-item">
                                <div style="width: 180px;">
                                    <p><b>{formatDateTime(activity.date)}</b></p>
                                </div>
                                <div>
                                    <p><b><i>{activity.userFullname}</i></b> {@html activity.message}</p>
                                </div>
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
            {:else}
                <p style="text-align: center; color: red;">No Recent Activities!</p>
        {/if}
    {/if}
</div>
<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100px;
        gap: 1rem;
    }

    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 20px;
        height: 20px;
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