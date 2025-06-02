const { getPool } = require("../../db");

const updateTaskStatuses = async () => {
    try {
        const pool = getPool();
        const today = new Date().toISOString().split("T")[0];
        console.log("Running automatic status update check. Today's Date: ", today);        
        
        const [overdueResult] = await pool.query(`
            UPDATE tasks 
            SET status = 'Overdue', updated_at = CURRENT_TIMESTAMP
            WHERE endDate < ?
            AND status <> 'Overdue'
            AND status NOT IN ('Completed', 'Cancelled')`, [today] );        
        return {
            overdueCount: overdueResult.affectedRows
        };
    } catch (error) {
        console.error("Error updating task statuses: ", error);
        throw error;
    }
}
module.exports = { updateTaskStatuses };