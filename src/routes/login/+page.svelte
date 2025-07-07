<script lang="ts">
    import '../../components/assets/css/login.css';
    import { goto } from '$app/navigation';
    import { login } from '$lib/api/authService';
    import { showToast } from '$lib/api/toastService';
    import { user } from '$lib/stores/user';
    
    let username = '';
    let password = '';
    let errorMessage = '';
    let loading = false;
    let loginError = false;

    function sleep (ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function resetErrorState() {
        loginError = false;
    }

    async function handleLogin(event: Event) {
        event.preventDefault();
        if (loading) return;
        errorMessage = '';
        loginError = false;
        loading = true;
        try {
            await login(username, password);
            await sleep(2000);
            await goto('/dashboard');
        } catch (error: any) {
            loginError = true;
            showToast({ type: "error", message: "Login Failed!" });
            username = '';
            password = '';
        } finally {
            loading = false;
        }
    }
</script>
<title>Login</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/login.css">
</head>

<main class="login-container">
    <div class="login-wrapper { loading ? 'loading-state' : '' }">
        <form on:submit={handleLogin}>
            <div class="login-box">
                <div class="login-logo-container">
                    <img class="login-logo" src="/logo.png" alt="Logo">
                    <h2 class="login-title">Project Task Manager</h2>
                </div>
                <div class="form-group {loginError ? 'shake' : ''}">
                    <input class="form-control {loginError ? 'error' : ''}" type="text" id="username" placeholder="" bind:value={username} on:focus={resetErrorState} required/>
                    <label for="username" class="floating-label">Username</label>
                </div>
                <div class="form-group {loginError ? 'shake' : ''}">
                    <input class="form-control {loginError ? 'error' : ''}" type="password" id="password" placeholder="" bind:value={password} on:focus={resetErrorState} required/>
                    <label for="password" class="floating-label">Password</label>
                </div>
                <div class="form-group">
                    <button class="login-submission" disabled={loading}>
                        {#if loading}
                            <span class="login-spinner"></span> Logging In...
                        {:else}
                            Login
                        {/if}
                    </button>
                </div>
            </div>    
        </form>
    </div>
    {#if loading}
        <div class="login-fullscreen-loader">
            <div class="login-lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            <!-- <div class="spinner-fullscreen"></div> -->
        </div>
    {/if}
</main>
<style>
    /* Animated FullScreen Loading Spinner */
    .login-lds-default,
    .login-lds-default div {
    box-sizing: border-box;
    }
    .login-lds-default {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
    }
    .login-lds-default div {
    position: absolute;
    width: 6.4px;
    height: 6.4px;
    background: currentColor;
    border-radius: 50%;
    animation: lds-default 1.2s linear infinite;
    }
    .login-lds-default div:nth-child(1) {
    animation-delay: 0s;
    top: 36.8px;
    left: 66.24px;
    }
    .login-lds-default div:nth-child(2) {
    animation-delay: -0.1s;
    top: 22.08px;
    left: 62.29579px;
    }
    .login-lds-default div:nth-child(3) {
    animation-delay: -0.2s;
    top: 11.30421px;
    left: 51.52px;
    }
    .login-lds-default div:nth-child(4) {
    animation-delay: -0.3s;
    top: 7.36px;
    left: 36.8px;
    }
    .login-lds-default div:nth-child(5) {
    animation-delay: -0.4s;
    top: 11.30421px;
    left: 22.08px;
    }
    .login-lds-default div:nth-child(6) {
    animation-delay: -0.5s;
    top: 22.08px;
    left: 11.30421px;
    }
    .login-lds-default div:nth-child(7) {
    animation-delay: -0.6s;
    top: 36.8px;
    left: 7.36px;
    }
    .login-lds-default div:nth-child(8) {
    animation-delay: -0.7s;
    top: 51.52px;
    left: 11.30421px;
    }
    .login-lds-default div:nth-child(9) {
    animation-delay: -0.8s;
    top: 62.29579px;
    left: 22.08px;
    }
    .login-lds-default div:nth-child(10) {
    animation-delay: -0.9s;
    top: 66.24px;
    left: 36.8px;
    }
    .login-lds-default div:nth-child(11) {
    animation-delay: -1s;
    top: 62.29579px;
    left: 51.52px;
    }
    .login-lds-default div:nth-child(12) {
    animation-delay: -1.1s;
    top: 51.52px;
    left: 62.29579px;
    }
    @keyframes lds-default {
    0%, 20%, 80%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.5);
    }
    }

    /* Shake animation and error styles */
    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .form-control.error {
        border-color: #ff4444;
        box-shadow: 0 0 0 1px #ff4444;
    }

    .form-control.error:focus + .floating-label,
    .form-control.error:not(:placeholder-shown) + .floating-label{
        color: #ff4444;
    }
    
    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
        }
        20%, 40%, 60%, 80% {
            transform: translateX(5px);
        }
    }
</style>