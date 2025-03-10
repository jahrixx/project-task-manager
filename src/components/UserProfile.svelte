<script lang="ts">
    import { goto } from '$app/navigation';
    import { isAuthenticated, user, type User } from '$lib/stores/user';
    import { onMount } from 'svelte';

    let currentUser: User | null = null;
    let loading = true;

    $: {
        if($user){
            currentUser = $user;
            console.log(currentUser);
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
    {:else if currentUser}
        <div class="user-header">
            <img src="{currentUser.profilePic ? `http://localhost:3000${currentUser.profilePic}` : '/src/components/assets/default-avatar.png'}" alt="Profile" class="profile-pic" />
            <div class="user-info">
                <button class="user-name" 
                    on:click={() => goto('/edit-profile')} 
                    on:keydown={(event) => event.key === 'Enter' && goto('/edit-profile')} 
                    aria-label="View Profile">
                    {currentUser.firstName} {currentUser.lastName}
                </button><br>
                <span class="user-role">{currentUser.role} - {currentUser.office}</span>
            </div>
        </div>
{/if}

<style>
    .user-header {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 35px;
        margin-bottom: 20px;
        margin-left: 15px;
        /* padding: 10px; */
        /* background: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); */
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
</style>
