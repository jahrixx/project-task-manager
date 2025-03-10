<script lang="ts">
    import { onMount } from "svelte";
    import { isAuthenticated } from "$lib/stores/user";
    import { goto } from "$app/navigation";
    import Sidebar from "../../components/Sidebar.svelte";
    import UserProfile from "../../components/UserProfile.svelte";
    import Login from '../login/+page.svelte';
    
    onMount(async () => {
        if(!isAuthenticated){
            goto('/login');
            return;
        }
    });
</script>

<title>Reports Generation</title>
{#if !isAuthenticated}
    <Login />
{:else}
    <div class="container">
        <Sidebar />
        <div class="main-container">
            <UserProfile />
            <h1>Welcome to Report Management!</h1>
        </div>
    </div>
{/if}

<style>
    h1 {
        margin-left: 50px;
    }
    
    .main-container {
        margin-left: 250px;
    }
</style>
