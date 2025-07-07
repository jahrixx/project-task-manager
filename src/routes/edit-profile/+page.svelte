<script lang="ts">
    import { get } from 'svelte/store';
    import { user } from '$lib/stores/user';
    import { onMount } from 'svelte';
    import Sidebar from '../../components/Sidebar.svelte';
    import { fetchUserProfile, uploadImage, updatePassword } from '$lib/api/profileService';
    import { showToast } from '$lib/api/toastService';
    import ToastContainer from '../../components/ToastContainer.svelte';
    
    let profilePic = '';
    let oldPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let loading = true;
    let currentUsername = get(user)?.username || '';
    
    const API_URL = import.meta.env.VITE_BASE_URL;

    onMount(async () => {
        try {
            const currentUser = get(user);
            if (!currentUser?.id) {
                showToast({ type: "error", message: "User ID not found!" });
                return;
            }
            const userData = await fetchUserProfile(String(currentUser?.id));
            user.update(u => ({ ...u, profilePic: userData.profilePic }));
            profilePic = userData.profilePic 
                ? `${API_URL}${userData.profilePic}`
                : '/src/components/assets/default-avatar.png';
        } catch (error) {
            showToast({ type: "error", message: "Network Error." });
        } finally {
            loading = false;
        }
    });

    async function handleImageUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target?.files?.length) {
            try {
                const currentUser = get(user);
                if (!currentUser?.id) {
                    showToast({ type: "error", message: "User ID not found!" });
                    return;
                }
                profilePic = await uploadImage(target.files[0], String(currentUser.id));
                showToast({ type: "success", message: "Profile Picture Updated Successfully!" });
            } catch (error) {
                showToast({ type: "error", message: "Network error during file upload!" });
            }
        }
    }

    async function handlePasswordUpdate() {
        if (!oldPassword || !newPassword || !confirmPassword) {
            showToast({ type: "error", message: "All password fields are required." });
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast({ type: "error", message: "New password and confirm password do not match." });
            return;
        }

        try {
            const currentUser = get(user);
            if (!currentUser?.id) {
                showToast({ type: "error", message: "User ID not found!" });
                return;
            }

            const data = await updatePassword(oldPassword, newPassword, String(currentUser.id));
            showToast({ type: "success", message: data.message });
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 2000)
            }
        } catch (error) {
            showToast({ type: "error", message: "An error occurred. Please try again." });
        }
    }
</script>

<title>Edit Profile</title>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="src/components/assets/css/edit-profile.css">
</head>
{#if loading}
    <div class="fullpage-loader">
        <div class="spinner"></div>
    </div>
{:else}
    <Sidebar />
    <div class="edit-profile">
        <h1 style="margin-bottom: 20px; margin-top: 20px;">Change Password</h1>
        <div class="profile-section">
            <ToastContainer />
            <img src="{profilePic}" alt="Profile" class="profile-pic" />
            <label class="custom-file-upload">
                <input type="file" accept="image/*" on:change={handleImageUpload} />
                Upload New Photo
            </label>
        </div>

        <div class="password-section">
            <div class="form-group-container">
                <label for="username">Username</label>
                <input id="username" type="text" bind:value={currentUsername} readonly disabled />
            </div>
            <div class="form-group-container">
                <label for="oldPassword">Current Password</label>
                <input id="oldPassword" type="password" bind:value={oldPassword} placeholder="Enter current password" />
            </div>

            <div class="form-group-container">
                <label for="newPassword">New Password</label>
                <input id="newPassword" type="password" bind:value={newPassword} placeholder="Enter new password" />
            </div>

            <div class="form-group-container">
                <label for="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="Confirm new password" />
            </div>
        </div>

        <div style="display: flex; justify-content: center; text-align: center;">
            <button class="update-btn" on:click={handlePasswordUpdate}>Change Password</button>
        </div>
    </div>    
{/if}