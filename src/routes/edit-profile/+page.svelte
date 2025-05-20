<script lang="ts">
    import type { User } from '$lib/stores/user';
    import { get } from 'svelte/store';
    import { user } from '$lib/stores/user';
    import { onMount } from 'svelte';
    import Sidebar from '../../components/Sidebar.svelte';

    let profilePic = '';
    let oldPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let loading = true;
    let currentUsername = get(user)?.username || '';

    // **Fetch User Data**
    onMount(async () => {
        try {
            const currentUser = get(user);
            if (!currentUser?.id) {
                alert("User ID not found!");
                return;
            }

            const response = await fetch(`http://localhost:3000/users/${currentUser.id}`);
            if (!response.ok) throw new Error("Failed to fetch user data");

            const userData: User = await response.json();
            console.log(currentUser.id);
            
            user.update(u => ({ ...u, profilePic: userData.profilePic }));

            profilePic = userData.profilePic 
                ? `http://localhost:3000${userData.profilePic}`  // Ensure no extra `/uploads/`
                : '/src/components/assets/default-avatar.png';

            console.log(profilePic)
        } catch (error) {
            alert("Network Error.")
        } finally {
            loading = false;
        }
    });

    // **Update Password**
    async function updatePassword() {
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('All password fields are required.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('New password and confirm password do not match.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/users/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: get(user)?.id, oldPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert(data.message);
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        }
    }

    // **Upload Profile Picture**
    async function uploadImage(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target?.files?.length) {
            const file = target.files[0];
            const formData = new FormData();
            formData.append('profilePic', file);

            try {
                const response = await fetch(`http://localhost:3000/users/upload/${get(user)?.id}`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Failed to upload profile picture');

                const data = await response.json();
                const newProfilePicUrl = `http://localhost:3000${data.profilePicUrl}?t=${Date.now()}`;
                
                profilePic = newProfilePicUrl;
                                
                user.update((u) => {
                    if (u) {
                        const updatedUser = { ...u, profilePic: newProfilePicUrl };
                        localStorage.setItem("user", JSON.stringify(updatedUser)); // Save to localStorage
                        return updatedUser;
                    }
                    return u;
                });
                alert("✅ Profile Picture Updated Successfully!");
            } catch (error) {
                alert("❌ Network error during file upload!");
            }
        }
    }
</script>

<title>Edit Profile</title>
<head>
    <link rel="stylesheet" href="src/components/assets/css/edit-profile.css">
</head>
{#if loading}
    <p style="text-align: center;">Loading Profile...</p>
{:else}
    <Sidebar />
    <div class="edit-profile">
        <h1 style="margin-bottom: 20px; margin-top: 20px;">Change Password</h1>
        <div class="profile-section">
            <img src="{profilePic}" alt="Profile" class="profile-pic" />
            <label class="custom-file-upload">
                <input type="file" accept="image/*" on:change={uploadImage} />
                Upload New Photo
            </label>
        </div>

        <div class="password-section">
            <div class="form-group">
                <label for="username">Username</label>
                <input id="username" type="text" bind:value={currentUsername} readonly disabled />
            </div>
            <div class="form-group">
                <label for="oldPassword">Current Password</label>
                <input id="oldPassword" type="password" bind:value={oldPassword} placeholder="Enter current password" />
            </div>

            <div class="form-group">
                <label for="newPassword">New Password</label>
                <input id="newPassword" type="password" bind:value={newPassword} placeholder="Enter new password" />
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="Confirm new password" />
            </div>
        </div>

        <div style="display: flex; justify-content: center; text-align: center;">
            <button class="update-btn" on:click={updatePassword}>Change Password</button>
        </div>
    </div>    
{/if}
<style>
    @media screen and (max-width: 600px) {
        .edit-profile {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
            /* padding: 20px 10px; */
            width: 100%;
            box-sizing: border-box;            
        }

        .profile-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 2.5px;
        }
        .password-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 400px;
        }
        .form-group {
            width: 100%;
            margin-bottom: 3px;
            padding: 0 10px;
            box-sizing: border-box;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            text-align: left;
        }
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 5px;
            font-size: 14px;
            box-sizing: border-box;
        }
        .update-btn {
            width: 100%;
            margin-top: 20px;
            padding: 10px 10px;
            font-size: 12px;
        }

    }

    /* @media screen and (max-width: 320px) {
        
    } */
</style>