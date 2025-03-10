const express = require("express");
const router = express.Router();
const pool = require("../db");

// 📌 Get all offices
// router.get("/", async (req, res) => {
//     try {
//         const [offices] = await pool.query("SELECT * FROM offices");
//         res.json(offices);
//     } catch (error) {
//         res.status(500).json({ message: "Error loading offices", error: error.message });
//     }
// });

// 📌 Create a new office
router.post("/", async (req, res) => {
    const { officeName } = req.body;

    if (!officeName) return res.status(400).json({ message: "Office name is required" });

    try {
        await pool.query("INSERT INTO offices (officeName) VALUES (?)", [officeName]);
        res.json({ message: "Office created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating office", error: error.message });
    }
});

// 📌 Update an office
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { officeName } = req.body;

    if (!officeName) return res.status(400).json({ message: "Office name is required" });

    try {
        const [result] = await pool.query("UPDATE offices SET officeName = ? WHERE id = ?", [officeName, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Office not found" });

        res.json({ message: "Office updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating office", error: error.message });
    }
});

// 📌 Delete an office
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM offices WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Office not found" });

        res.json({ message: "Office deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting office", error: error.message });
    }
});

// Route to get offices
const offices = [
    { id: 1, officeName: "Admin Office" },
    { id: 2, officeName: "HR Department" },
    { id: 3, officeName: "IT Department" },
    { id: 4, officeName: "Finance Department" },
    { id: 5, officeName: "Marketing Department" },
];

router.get("/", (req, res) => {
    res.json(offices);
});

module.exports = router;
