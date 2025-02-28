<script lang="ts">
    import { get } from 'svelte/store';
    import { users, currentUser, isLoggedIn } from '../../lib/mockData';
    import { goto } from '$app/navigation';

    let email = '';
    let password = '';
    let errorMessage = '';

    function login() {
        if (!email || !password) {
            errorMessage = "Email and password are required!";
            showError();
            return;
        }
        const foundUser = get(users).find((user) => user.email === email && user.password === password);
        if (foundUser) {
            currentUser.set(foundUser);
            isLoggedIn.set(true);
            errorMessage = "";
            goto('/');
        } else {
            errorMessage = "Incorrect email or password.";
            showError();
        }
    }

    function showError(){
        alert(errorMessage);
    }
</script>

<title>Login</title>
<div class="login-container">
    <div class="login-box">
        <div class="logo-container">
            <img src="/src/components/assets/logo.png" alt="Logo">
            <h2>Project Task Manager</h2>
        </div>
        
        <input type="email" placeholder="Email" bind:value={email} />
        <input type="password" placeholder="Password" bind:value={password} />
        <button on:click={login}>Login</button>
        <!-- {#if errorMessage}
            <p style="color: red;">{errorMessage}</p>
        {/if} -->
    </div>
</div>    

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