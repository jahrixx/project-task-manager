<script lang="ts">
    import { goto } from '$app/navigation';
    import { login } from '$lib/api/authService';
    
    let username = '';
    let password = '';
    let errorMessage = '';
    let loading = false;

    async function handleLogin(event: Event) {
        event.preventDefault();
        if (loading) return;
        errorMessage = '';
        loading = true;
        try {
            await login(username, password);
            goto('/dashboard');
        } catch (error: any) {
            errorMessage = error?.message || 'Login Failed!';
            alert(errorMessage);
        } finally {
            loading = false;
        }
    }
</script>
<title>Login</title>
<main class="login-container">
    <div class="login-wrapper { loading ? 'loading-state' : '' }">
        <form on:submit={handleLogin}>
            <div class="login-box">
                <div class="logo-container">
                    <img src="/src/components/assets/logo.png" alt="Logo">
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
</main>
<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 95vh; 
    }

    .login-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: white;
        padding: 2rem;
        width: 350px;
    }

    .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 2rem;
    }

    .logo-container img {
        width: 150px;
        height: 150px;
    }

    .logo-container h2 {
        text-align: left;
        font-size: 2.6rem;
        margin: 0;
        color: #333;
    }

    input {
        width: 94%;
        padding: 10px;
        margin: 3px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    button {
        width: 100%;
        padding: 10px;
        background-color: #23BEDA;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        margin-top: 20px;
        font-size: 1rem;
    }

    button:hover {
        background-color: #23BEDA;
        opacity: 70%;
    }

    .spinner {
        border: 3px solid #ddd;
        border-top: 3px solid #333;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        animation: spin 0.6s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .login-wrapper.loading-state {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
    }

    @media screen and (max-width: 500px) and (min-width: 300px) {
        .login-container {
            margin-top: 15vh;
            padding: 0 10px;
            height: auto;
        }

        .login-box {
            width: 100%;
            padding: 1.5rem 1.5rem;
            box-sizing: border-box;
        }
        .logo-container {
            flex-direction: column;
            gap: 10px;
            text-align: center;
            margin-bottom: 6.5vh;
        }
        .login-container img {
            width: 100px;
            height: 100px;
        }
        .logo-container h2 {
            font-size: 1.8rem;
            text-align: center;
        }
        input {
            width: 100%;
            font-size: 1rem;
        }
        button {
            margin-top: 3vh;
            font-size: 1rem;
            padding: 10px;
        }
    }
</style>