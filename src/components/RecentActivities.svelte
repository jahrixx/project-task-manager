<script lang="ts">
    export let activities: { message: string, date: string, userFullname: string }[] = [];
    export let role: string;

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

<div class="recent-activities">
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
                                <p><b><i>{activity.userFullname}</i></b> {activity.message}</p>
                            </div>
                        </div>
                    {:else if role === 'Manager'}
                        <div class="activity-item">
                            <div style="width: 180px;">
                                <p><b>{formatDateTime(activity.date)}</b></p>
                            </div>
                            <div>
                                <p><b><i>{activity.userFullname}</i></b> {activity.message}</p>
                            </div>
                        </div>
                    {:else if role === 'Employee'}
                        <div class="activity-item">
                            <div style="width: 180px;">
                                <p><b>{formatDateTime(activity.date)}</b></p>
                            </div>
                            <div>
                                <p><b><i>{activity.userFullname}</i></b> {activity.message}</p>
                            </div>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
        {:else}
            <p style="text-align: center;">No Recent Activities!</p>
    {/if}
</div>

<style>
    .activity-item{
        /* border: 2px solid black; */
        /* position: fixed; */
        display: flex; 
        gap: 50px; 
        margin: 0; 
        padding: 0; 
        line-height: normal;
        height: 15vh;
    }

    .activity-item p {
        margin: 5px;
    }

    .recent-activities {
        background-color: transparent;
        color: black;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 5px;
        max-height: 80px;
        overflow-y: auto;
        scrollbar-width: none;
        /* border: 2px solid black; */
    }

    .recent-activities::-webkit-scrollbar{
        display: none;
    }

    .recent-activities ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .recent-activities li {
        padding: 0;
        margin: 0;
    }
</style>