const express = require("express");
const bcrypt = require("bcryptjs");
const { getPool } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const pool = getPool();
            if (!pool) return res.status(500).json({ message: "Database connection issue" });
                const [users] = await pool.query("SELECT id, username, role, office, firstName, lastName, number, address, birthday FROM users");
                res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error while fetching users." });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
            if (!pool) return res.status(500).json({ message: "Database connection issue" });
                const [users] = await pool.query(
                    "SELECT id, username, role, office, firstName, lastName, number, address, birthday, profilePic FROM users WHERE id = ?",
                    [id]
                );
            if (users.length === 0) return res.status(404).json({ message: "User not found." });
                res.json(users[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error while fetching user." });
    }
});

router.post("/", async (req, res) => {
    const { role, office, firstName, lastName, number, address, birthday } = req.body;
    if (!role || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    try {
        const pool = getPool();
            if (!pool) return res.status(500).json({ message: "Database connection issue" });
                const defaultPassword = await bcrypt.hash("default123", 10);
                const [result] = await pool.query(
                    "INSERT INTO users (username, password, role, office, firstName, lastName, number, address, birthday) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [`PENDING`, defaultPassword, role, office, firstName, lastName, number || null, address || null, birthday || null]
                );

                if(result.affectedRows === 0){
                    return res.status(500).json({ message: "Failed to create user." });
                }
                    const userId = result.insertId;
                    const username = `user${userId}`;
                    await pool.query("UPDATE users SET username = ? WHERE id = ?", [username, userId]);
                    res.json({ message: "User created successfully.", userId, username });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Server error while creating user." });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
            if (!pool) return res.status(500).json({ message: "Database connection issue" });
                const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            res.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error while deleting user." });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, role, office, number, address, birthday } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required." });
    }

    try {
        const pool = getPool();
            if (!pool) return res.status(500).json({ message: "Database connection issue" });
                const [result] = await pool.query(
                    "UPDATE users SET firstName = ?, lastName = ?, role = ?, office = ?, number = ?, address = ?, birthday = ? WHERE id = ?",
                    [
                        firstName,
                        lastName,
                        role ?? null,
                        office ?? null,
                        number ?? null,
                        address ?? null,
                        birthday ?? null,
                        id
                    ]
                );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found or no changes detected." });
            }

            res.json({ message: "User updated successfully!" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error while updating user.", error: error.message });
    }
});

router.post("/update-password", async (req, res) => {
    try {
        const { id, oldPassword, newPassword } = req.body;
            if (!id || !oldPassword || !newPassword) return res.status(400).json({ message: "All fields are required" });
                const pool = getPool();
                const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [id]);

            if (rows.length === 0) return res.status(404).json({ message: "User not found" });
                const user = rows[0];
                const passwordMatch = await bcrypt.compare(oldPassword, user.password);
            
            if (!passwordMatch) return res.status(401).json({ message: "Incorrect old password." });
                const hashedPassword = await bcrypt.hash(newPassword, 10);
        
                await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
                res.json({ message: "Password updated successfully!", redirect: "/login" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Server error while updating password." });
    }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `profile-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

router.post('/upload/:id', upload.single('profilePic'), async (req, res) => {
    const { id } = req.params;
    const pool = await getPool();

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const profilePicUrl = `/uploads/${req.file.filename}`;

    try {
        await pool.query('UPDATE users SET profilePic = ? WHERE id = ?', [profilePicUrl, id]);
        res.json({ profilePicUrl });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
