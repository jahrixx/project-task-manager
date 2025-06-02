const express = require("express");
const { getPool } = require("../db")
const router = express.Router();

router.patch('/:id/archive', async(req, res) => {
    const pool = getPool();
    try {
        const [result] = await pool.execute(`
            UPDATE tasks 
            SET isArchived = TRUE, archived_at = NOW(), unArchived_at = NULL
            WHERE id = ? 
            `, [req.params.id]);
                if(result.affectedRows === 0){
                    return res.status(404).json({message: 'Task Not Found!'});
                }
                const [task] = await pool.execute(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
                res.json(task[0]);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

router.patch('/:id/unarchive', async(req, res) => {
    const pool = getPool();
    try {
        const [result] = await pool.execute(`
            UPDATE tasks 
            SET isArchived = FALSE, unArchived_at = NOW(), archived_at = NULL
            WHERE id = ?
            `, [req.params.id]);
                if(result.affectedRows === 0){
                    return res.status(404).json({message: 'Task Not Found!'});
                }
                const [task] = await pool.execute(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
                res.json(task[0]);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

router.get('/tasks/archive', async(req, res) => {
    try {
        let query = 'SELECT * FROM tasks';
        const params = [];
            if(req.query.is_archived !== undefined) {
                query += 'WHERE isArchived = ?';
                params.push(req.query.isArchived === 'TRUE')
            }
            query += 'ORDER BY created_at DESC';
            const [task] = await pool.execute(query, params);
            res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});
module.exports = router;