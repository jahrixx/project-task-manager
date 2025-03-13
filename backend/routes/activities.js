const express = require("express");
const { getPool } = require("../db");
const router = express.Router();

// Add a new route to fetch employees in the same office
router.get("/", async (req, res) => {
    const { userId, role } = req.query;

    if (!userId || !role) {
        return res.status(400).json({ message: "User ID and Role is required." });
    }

    try {
        let query;
        let queryParams = [];
        const pool = getPool();

        if (role === 'Admin') {
            query = `
                SELECT a.*, CONCAT(u.firstName, ' ', u.lastName) AS userFullname
                FROM activities a
                JOIN users u ON a.createdBy = u.id OR a.assignedTo = u.id
                ORDER BY a.date DESC LIMIT 10
            `;
        } else if(role === 'Manager') {
            query = `
                SELECT a.*, CONCAT(u.firstName, ' ', u.lastName) AS userFullname
                FROM activities a
                JOIN users u ON a.createdBy = u.id OR a.assignedTo = u.id
                WHERE u.office = (SELECT office FROM users WHERE id = ?)
                ORDER BY a.date DESC LIMIT 10
            `;
             queryParams = [userId];
        } else if (role === 'Employee') {
            query = `
                SELECT a.*, CONCAT(u.firstName, ' ', u.lastName) AS userFullname
                FROM activities a
                JOIN users u ON a.createdBy = u.id OR a.assignedTo = u.id
                WHERE a.createdBy = ? OR a.assignedTo = ?
                ORDER BY a.date DESC LIMIT 10
            `;
             queryParams = [userId, userId]
        }

        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ message: "Server error while fetching activities." });
    }
});

module.exports = router;