const express = require("express");
const bcrypt = require("bcryptjs");
const { getPool } = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const pool = await getPool();

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const firstTimeLogin = await bcrypt.compare("default123", user.password);
        
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            office: user.office,
            profilePic: user.profilePic,
            firstTimeLogin: firstTimeLogin
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;