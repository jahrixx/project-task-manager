<script lang="ts">
    import { currentUser } from '../../lib/mockData';

    let profilePic = $currentUser.profilePic || '/src/components/assets/default-avatar.png';
    let firstname = $currentUser.firstname;
    let lastname = $currentUser.lastname;

    let oldPassword = $currentUser.password;
    let newPassword = '';
    let confirmPassword = '';
   

    function updateProfile() {
        // Update user data (Mock)
        if (newPassword && newPassword !== confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }

        currentUser.update(user => ({ ...user, firstname, lastname, profilePic }));
        alert("Profile updated successfully!");
    }

    function uploadImage(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target && target.files) {
            const file = target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                profilePic = reader.result as string;
                currentUser.update(user => ({ ...user, profilePic }));
            };
            reader.readAsDataURL(file);
        }
    }
}
</script>

<div class="edit-profile">
    <div class="profile-section">
        <img src={profilePic} alt="Profile" class="profile-pic" />
        <label class="custom-file-upload">
            <input type="file" accept="image/*" on:change={uploadImage} />
            Upload New Photo
        </label>
    </div>

    <div class="form-container">
        <div class="user-info">
            <h3>Edit User Information</h3>
            <div class="form-group">
                <label for="firstname">First Name</label>
                <input id="firstname" type="text" bind:value={firstname} />
            </div>

            <div class="form-group">
                <label for="lastname">Last Name</label>
                <input id="lastname" type="text" bind:value={lastname} />
            </div>
        </div>
        <div class="password-section">
            <h3>Change Password</h3>
            <div class="form-group">
                <label for="oldPassword">Old Password</label>
                <input id="oldPassword" type="password" bind:value={oldPassword} placeholder="Enter current password" />
            </div>
    
            <div class="form-group">
                <label for="newPassword">New Password</label>
                <input id="newPassword" type="password" bind:value={newPassword} placeholder="Enter new password" required/>
            </div>
    
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="Confirm new password" required/>
            </div>
        </div>
    </div>

    <button on:click={updateProfile}>Save Changes</button>
</div>
<style>
    .edit-profile {
        max-width: 600px;
        margin: auto;
        background: transparent;
        padding: 1rem;
        text-align: center;
        margin-top: 2px;
    }

    .profile-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 5px;
    }

    .profile-pic {
        width: 85px;
        height: 85px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #23BEDA;
        margin-bottom: 10px;
        transition: transform 0.3s ease-in-out;
    }

    .profile-pic:hover {
        transform: scale(1.05);
    }

    .custom-file-upload {
        background: #23BEDA;
        color: white;
        padding: 7px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s;
    }

    .custom-file-upload:hover {
        background: #1CA1C1;
    }

    .custom-file-upload input {
        display: none;
    }

    /* Flexbox container for side-by-side layout */
    .form-container {
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }

    .user-info, .password-section {
        flex: 1;
        padding-left: 10px;
        padding-right: 10px;
        border-radius: 8px;
        text-align: left;
    }

    .form-group {
        margin-bottom: 10px;
    }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 5px;
        color: #444;
    }

    input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
        transition: border 0.3s;
    }

    input:focus {
        border-color: #23BEDA;
        outline: none;
    }

    button {
        width: 100%;
        padding: 12px;
        background-color: #23BEDA;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.3s, transform 0.2s;
        margin-top: 10px;
    }

    button:hover {
        background-color: #1CA1C1;
        transform: scale(1.02);
    }

    @media (max-width: 600px) {
        .form-container {
            flex-direction: column;
        }
    }
</style>