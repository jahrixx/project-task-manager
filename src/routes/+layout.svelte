<script>
    import Sidebar from '../components/Sidebar.svelte';
    import UserProfile from '../components/UserProfile.svelte';
    import { isLoggedIn } from '../lib/mockData'; // Import your auth state
</script>

{#if $isLoggedIn}
    <div class="container">
        <Sidebar />
        
        <div class="main-container">
            <UserProfile />
            <slot /> <!-- Render current page content -->
        </div>
    </div>
{:else}
    <slot /> <!-- Show login page if not logged in -->
{/if}

<style>
    .container {
        display: flex;
        height: 90vh;
    }

    .main-container {
        flex: 1;
        margin-left: 250px;
        padding: 20px;
        overflow-y: auto;
        background: #ffffff;
    }
</style>
