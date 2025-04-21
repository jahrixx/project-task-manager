// const { title } = require("process");
const { getPool } = require("../../db");
const { createNotification } = require("../notification");

async function checkOverdueTasks() {
    const pool = getPool();
    
    const [ tasks ] = await pool.query(
        `SELECT id, title, assignedTo FROM tasks WHERE endDate < CURDATE() AND status != 'Completed'`
    );

    for (const task of tasks){
        const message = `Task "${task.title}" is Overdue!`;

        const [ existing ] = await pool.query(
            `SELECT id FROM notifications WHERE userId = ? AND message = ? AND taskId = ? LIMIT 1`,
            [task.assignedTo, message, task.id]
        )

        if(existing.length === 0){
            await createNotification(task.assignedTo, message, task.id);
            console.log(`Notification Created For Task: ${task.title}.`);
        } else {
            console.log(`Notification For Task: ${task.title}. already exists! Skipped!`);
        }
    }
}

module.exports = { checkOverdueTasks };