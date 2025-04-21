const express = require("express");
const { getPool } = require("../db")

const router = express.Router();

async function createNotification(userId, message, taskId) {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO notifications (userId, message, taskId) VALUES (?,?,?)`,
        [userId, message, taskId]
    );
}

router.get('/:userId', async (req, res) => {
    const pool = getPool();
    const { userId } = req.params;
    
    const [ rows ] = await pool.query(
        `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
        [userId]
    );

    res.json(rows);
});

router.post('/read/:id', async (req, res) => {
    const pool = getPool();
    const { id } = req.params;

    const [ result ] = await pool.query(
        `UPDATE notifications SET isRead = 1 WHERE id = ?`,
        [ id ]
    );

    res.json(result);
});

module.exports = {router, createNotification};