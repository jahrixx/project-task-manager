<script lang="ts">
    import { goto } from '$app/navigation';
    import { currentUser } from '../lib/mockData';
</script>

<div class="user-header">
    <img src="{$currentUser.profilePic || '/src/components/assets/default-avatar.png'}" alt="Profile" class="profile-pic" />
    
    <div class="user-info">
        <button class="user-name" 
            on:click={() => goto('/edit-profile')} 
            on:keydown={(event) => event.key === 'Enter' && goto('/edit-profile')} 
            aria-label="View Profile">
            {$currentUser.firstname} {$currentUser.lastname}
        </button>
        <span class="user-role">{$currentUser.role}</span>
    </div>
</div>

<style>
    .user-header {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
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

    .user-info {
        display: flex;
        flex-direction: column;
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
