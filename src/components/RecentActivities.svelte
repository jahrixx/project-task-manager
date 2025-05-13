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
<link rel="stylesheet" href="src/components/assets/css/recent-activities.css">
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
</div>