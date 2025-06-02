<script lang="ts">
    import { goto } from '$app/navigation';
    import { login } from '$lib/api/authService';
    import { showToast } from '$lib/api/toastService';
    import ToastContainer from '../../components/ToastContainer.svelte';
    
    let username = '';
    let password = '';
    let errorMessage = '';
    let loading = false;

    function sleep (ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function handleLogin(event: Event) {
        event.preventDefault();
        if (loading) return;
        errorMessage = '';
        loading = true;
        try {
            await login(username, password);
            await sleep(2000);
            await goto('/dashboard');
        } catch (error: any) {
            showToast({ type: "error", message: "Login Failed!" });
        } finally {
            loading = false;
        }
    }
</script>
<title>Login</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/login.css">
</head>

<ToastContainer />
<main class="login-container">
    <div class="login-wrapper { loading ? 'loading-state' : '' }">
        <form on:submit={handleLogin}>
            <div class="login-box">
                <div class="logo-container">
                    <img src="/logo.png" alt="Logo">
                    <h2>Project Task Manager</h2>
                </div>
                <input type="text" id="username" placeholder="Username" bind:value={username} required/>
                <input type="password" id="password" placeholder="Password" bind:value={password} required/>
                <button type="submit" disabled={loading}>
                    {#if loading}
                        <span class="spinner"></span> Logging In...
                    {:else}
                        Login
                    {/if}
                </button>
            </div>    
        </form>
    </div>
    {#if loading}
        <div class="fullscreen-loader">
            <div class="spinner-fullscreen"></div>
        </div>
    {/if}
</main>
