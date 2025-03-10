<script lang="ts">
    import { goto } from '$app/navigation';
    import { user, isAuthenticated } from '$lib/stores/user';

    let username = '';
    let password = '';
    let errorMessage = '';
    const BACKEND_URL = "http://localhost:3000";

    async function login() {
        errorMessage = '';

        try {
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                $user = data;
                $isAuthenticated = true;
                goto('/dashboard');
            } else {
                errorMessage = data.message || 'Login Failed!';
                alert(errorMessage);
            }
        } catch (error) {
            errorMessage = "An error occurred during login.";
            alert(errorMessage);
        }
    }
</script>

<main>
    <title>Login</title>
    <!-- {#if errorMessage}
        <p style="color: red;">{errorMessage}</p>
    {/if} -->
    <div class="login-container">
        <form on:submit|preventDefault={login}>
            <div class="login-box">
                <div class="logo-container">
                    <img src="/src/components/assets/logo.png" alt="Logo">
                    <h2>Project Task Manager</h2>
                </div>
                
                <input type="text" id="username" placeholder="Username" bind:value={username} required/>
                <input type="password" id="password" placeholder="Password" bind:value={password} required/>
                <button type="submit">Login</button>
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
        /* Full height */
        /* width: 100%; Full width */
    }

    .login-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: white;
        padding: 2rem;
        /* border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); */
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
</style>