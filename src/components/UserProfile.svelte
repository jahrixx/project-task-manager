<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/user';
    import { onMount } from 'svelte';

    let currentUser = $user;
    let loading = true;
    
    $: currentUser = $user;
    $: {
        if($user){
            currentUser = $user;
            loading = false;
        } else {
            loading = false;
        }
    }
    onMount(() => {
        if(!$user){
            goto('/login');
        }
    })
</script>
{#if loading}
    <p style="text-align: center; color: red;">loading user...</p>
        {:else if $user}
            <div class="user-header">
                <img src="{currentUser?.profilePic
                ? currentUser.profilePic.startsWith('http')
                ? currentUser.profilePic
                : `${import.meta.env.VITE_BASE_URL}${currentUser.profilePic}`
                : '/src/components/assets/default-avatar.png'}" alt="Profile" class="profile-pic" />
                <div class="user-info">
                    <button class="user-name" 
                        on:click={() => goto('/edit-profile')} 
                        on:keydown={(event) => event.key === 'Enter' && goto('/edit-profile')} 
                        aria-label="View Profile">
                        {$user.firstName} {$user.lastName}
                    </button><br>
                    <span class="user-role">{$user.role} - {$user.office}</span>
                </div>
            </div>
{/if}
<style>
.user-header {
display: flex;
align-items: center;
gap: 5px;
margin-top: 32.5px;
margin-bottom: 20px;
margin-left: 15px;
}

.profile-pic {
width: 65px;
height: 65px;
border-radius: 50%;
object-fit: cover;
border: 2px solid #23BEDA;
margin-left: 30px;
}

.user-name {
background: none;
border: none;
font-size: 1rem;
font-weight: bold;
cursor: pointer;
color: #23BEDA;
}

.user-name:hover {
text-decoration: underline;
}

.user-role {
padding-left: 7px;
font-size: 0.9rem;
color: #555;
}

@media screen and (max-width: 500px) and (min-width: 300px) {
.user-header {
margin-bottom: 10px;
}
/* Remove all tap highlights and focus rings */
button {
-webkit-tap-highlight-color: transparent;
-webkit-touch-callout: none;
-webkit-user-select: none;
user-select: none;
outline: none;

/* For IE/Edge */
-ms-touch-action: manipulation;
touch-action: manipulation;
}
}
</style>