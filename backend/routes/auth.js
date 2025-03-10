const express = require("express");
const bcrypt = require("bcryptjs");
const { getPool } = require("../db");

const router = express.Router();

// **POST: Login Authentication**
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const pool = await getPool();

    console.log("Username received:", username);
    console.log("Password received:", password);

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
        console.log("Rows from database: ", rows);

        if (rows.length === 0) {
            console.log("User not found");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = rows[0];

        // **Compare entered password with hashed password from the database**
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password Match:", passwordMatch);
        if (!passwordMatch) {
            console.log("Password Mismatch:");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // **Check if it's the user's first time logging in**
        const firstTimeLogin = await bcrypt.compare("default123", user.password);


        // ✅ **Ensure the user ID is included in the response**
        res.json({
            id: user.id, // ✅ Now sending `id` to the frontend
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            office: user.office,
            profilePic: user.profilePic,
            firstTimeLogin: firstTimeLogin
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;