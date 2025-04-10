const express = require("express");
const { getPool } = require("../db")

const router = express.Router();

router.patch('/:id/archive', async(req, res) => {
    try {
        const [result] = await pool.execute(`
            UPDATE tasks 
            SET is_archived = TRUE, archived_at = NOW()
            WHERE id = ? 
            `, [req.params.id]);

            console.log([req.params.id]);

            if(result.affectedRows === 0){
                return res.status(404).json({message: 'Task Not Found!'});
            }

            const [task] = await pool.execute(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
            req.json(task[0]);

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

module.exports = router;