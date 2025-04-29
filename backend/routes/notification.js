const express = require("express");
const { getPool } = require("../db");
const { off } = require("process");

const router = express.Router();

async function createNotification(userId, message, taskId, type) {
    const pool = getPool();
    
    try {
        await pool.query(
            `INSERT INTO notifications (userId, message, taskId, type, isRead, createdAt) VALUES (?,?,?,?,0,CURRENT_TIMESTAMP)`,
            [userId, message, taskId, type]
        );    
        console.log(`Notification created for user ${userId}: ${message}`);
        return true;
    } catch (error) {
        console.error("Error creating notification: ", error);
        return false;
    }
}

// async function createAdminNotification(message, taskId, type = 'task') {
//     const pool = getPool();
    
//     try {
//         const [adminRows] = await pool.query(
//             `SELECT id FROM users WHERE role = 'Admin`,
//             [message, taskId, type]
//         );    
        
//         for(const admin of adminRows) {
//             await createNotification(admin.id, message, taskId, type);
//         }
        
//         return true;
//     } catch (error) {
//         console.error("Error creating admin notification: ", error);
//         return false;
//     }
// }

async function getUnreadCount(userId) {
    const pool = getPool();
    const [result] = await pool.query(
        `SELECT COUNT(*) as count FROM notifications
        WHERE userId = ? AND isRead = 0`,
        [userId]
    );
    return result[0].count;
}

router.get('/:userId', async (req, res) => {
    try {
        const pool = getPool();
        const { userId } = req.params;
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        let query = `
            SELECT n.*, t.title as taskTitle, u.profilePic
            FROM notifications n
            LEFT JOIN tasks t ON n.taskId = t.id
            LEFT JOIN users u ON n.userId = u.id
            WHERE n.userId = ? AND t.status != 'Completed' AND t.isArchived = 0 
        `;

        const params = [ userId ];

        if(unreadOnly === 'true'){
            query += `AND n.isRead = 0`;
        }

        query += `ORDER BY n.createdAt DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [ notifications ] =  await pool.query(query, params);

        const [ countResult ] = await pool.query(
            `SELECT COUNT(*) as total FROM notifications WHERE userId = ?`,
            [userId]
        )
        // const [ rows ] = await pool.query(
        //     `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
        //     [userId]
        // );

        res.json({
            notifications,
            total: countResult[0].total,
            unreadCount: await getUnreadCount(userId)
        });

    } catch (error) {
        console.error("Error fetching notifications: ", error);
        res.status(500).json({ message: "Server error while fetching notifications." });   
    }
});

router.get('/admin/all', async (req, res) => {
    try {
        const pool = getPool();
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        let query = `
            SELECT n.*, t.title as taskTitle, u.firstName, u.lastName, u.profilePic
            FROM notifications n
            LEFT JOIN tasks t ON n.taskId = t.id
            LEFT JOIN users u ON n.userId = u.id
            WHERE t.status != 'Completed' AND t.isArchived = 0
        `;

        if(unreadOnly === 'true'){
            query += `AND n.isRead = 0`;
        }

        query += `ORDER BY n.createdAt DESC LIMIT ? OFFSET ?`;

        const [ notifications ] =  await pool.query(query, [parseInt(limit), parseInt(offset)]);
        const [ countResult ] = await pool.query(`SELECT COUNT(*) as total FROM notifications`);
        const [ unreadCountResult ] = await pool.query(`SELECT COUNT(*) as unread FROM notifications WHERE isRead = 0`);

        res.json({
            notifications,
            total: countResult[0].total,
            unreadCount: unreadCountResult[0].unread
        });

    } catch (error) {
        console.error("Error fetching all notifications for admin: ", error);
        res.status(500).json({ message: "Server error while fetching notifications." });   
    }
});

router.get('/:userId/unread-count', async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await getUnreadCount(userId);
        res.json({ unreadCount: count });

    } catch (error) {
        console.error("Error getting unread count: ", error);
        res.status(500).json({ message: "Server error while getting unread count." })
    }
});

router.post('/read/:id', async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.params;

        const [ result ] = await pool.query(
            `UPDATE notifications SET isRead = 1 WHERE id = ?`,
            [ id ]
        );

        res.json({ result, success: true });

    } catch (error) {
        console.error("Error marking notification as read: ", error);
        res.status(500).json({ message: "Server error while updating notification." })
    }
});

router.post('/:userId/read-all', async (req, res) => {
    try {
        const pool = getPool();
        const { userId } = req.params;

        const [ result ] = await pool.query(
            `UPDATE notifications SET isRead = 1 WHERE id = ?`,
            [ id ]
        );

        res.json({ result, success: true });

    } catch (error) {
        console.error("Error marking notification as read: ", error);
        res.status(500).json({ message: "Server error while updating notification." })
    }
});

module.exports = {router, createNotification};