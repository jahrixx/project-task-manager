const express = require("express");
const router = express.Router();
const { updateTaskStatuses } = require("./services/taskService");
const { getPool } = require("../db");
const { createNotification } = require("./notification");
const { title } = require("process");

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'pending': return '#FF7518';
        case 'in progress': return '#1434A4';
        case 'completed': return '#00A36C';
        case 'overdue': return '#C41E3A';
        case 'cancelled': return '#E34234'; 
        default: return '#000000';
    }
}

router.get("/", async (req, res) => {
    const { userId, role, office } = req.query;
    const numericUserId = Number(userId);
    const pool = getPool();
    let baseQuery = `
        SELECT tasks.id, 
               tasks.title, 
               tasks.description, 
               tasks.isArchived,
               DATE_FORMAT(tasks.startDate, '%Y-%m-%d') AS startDate, 
               DATE_FORMAT(tasks.endDate, '%Y-%m-%d') AS endDate, 
               tasks.status,
               tasks.createdBy,
               tasks.assignedTo, 
               CONCAT(u1.firstName, ' ', u1.lastName) AS assignedToName, 
               CONCAT(u2.firstName, ' ', u2.lastName) AS createdByName, 
               u1.role AS assigneeRole,
               u2.role AS creatorRole, 
               u2.office AS creatorOffice
        FROM tasks
        LEFT JOIN users u1 ON tasks.assignedTo = u1.id
        LEFT JOIN users u2 ON tasks.createdBy = u2.id
    `;
    const queryParams = [];
    let conditions = [];

    if (userId && role) {
        if (role === "Admin") {
            baseQuery += "ORDER BY u2.office ASC, tasks.id DESC";

        } else if (role === "Manager") {
            conditions.push(`
                    (
                        (tasks.createdBy = tasks.assignedTo AND tasks.createdBy = ?) OR
                        (tasks.assignedTo = ?) OR
                        (u1.role = 'Employee' AND UPPER(u1.office) = UPPER(?))
                    )
                `);

            queryParams.push(numericUserId, numericUserId, office.trim());

        } else if (role === "Employee") {
            conditions.push(`(tasks.createdBy = ? OR tasks.assignedTo = ?)`);
            queryParams.push(numericUserId, numericUserId);
        }
    }

    if (conditions.length > 0) {
        baseQuery += " WHERE " + conditions.join(" AND ");
    }

    try {
        await updateTaskStatuses();

        const [tasks] = await pool.query(baseQuery, queryParams);
        if(role === "Admin"){
            const groupedTasks = tasks.reduce((acc, task) => {
                if(!acc[task.creatorOffice]) {
                    acc[task.creatorOffice] = [];
                }
                acc[task.creatorOffice].push(task);
                return acc;
            }, {});

            res.json(groupedTasks);
        } else {
            res.json(tasks);
        }
    } catch (error) {
        console.error("Error fetching tasks from MySQL:", error);
        res.status(500).json({ message: "Server error while fetching tasks." });
    }
});

router.get("/archived", async (req, res) => {
    const pool = getPool();

    const sql = `
        SELECT t.id,
                t.title,
                t.description,
                t.status,
                t.endDate,
                t.assignedTo,
                t.createdBy,
                t.isArchived,
                u2.office,
                CONCAT(u1.firstName, ' ', u1.lastName) AS assignedToName, 
                CONCAT(u2.firstName, ' ', u2.lastName) AS createdByName
        FROM tasks t
        LEFT JOIN users u1 ON t.assignedTo = u1.id
        LEFT JOIN users u2 ON t.createdBy = u2.id
        WHERE t.isArchived = 1
        ORDER BY t.endDate DESC
    `;

    try {
        const [results] = await pool.query(sql);
        res.json(results);

    } catch (error) {
        console.error('Error Fetching archived tasks: ', error);
        return res.status(500).json({error: 'Database Error!'});
    }
    
});

router.patch("/:id/archive", async (req, res) => {
    const taskId = req.params.id;
    const pool = getPool();

    try {
        let sql = `
            UPDATE tasks
                SET isArchived = 1, archived_at = NOW()
                WHERE id = ?
        `;
        const [result] = await pool.query(sql, [taskId]);

        if(result.affectedRows === 0){
            return res.json({message: 'Task Updated Successfully!'});
        }
        
        res.json({message: 'Task Archived Successfully!'});

    } catch (error) {
        console.error('Error archiving tasks', error);
        result.status(500).json({ error: 'Internal Sever Error' });
    }
});

router.patch("/:id/unarchive", async (req, res) => {
    const taskId = req.params.id;
    const pool = getPool();

    try {
        let sql = `
            UPDATE tasks
                SET isArchived = 0, unArchived_at = NOW()
                WHERE id = ?
        `;

        const [result] = await pool.query(sql, [taskId]);
        
        if(result.affectedRows === 0){
            return res.json({message: 'Task Updated Successfully!'});
        }
        
        res.json({message: 'Task Unarchived Successfully!'});

    } catch (error) {
        console.error('Error unarchiving tasks', error);
        res.status(500).json({ error: 'Internal Sever Error' });
    }
});

router.get("/status-count/:assignedTo", async (req, res) => {
    const userId = req.params.assignedTo;
    const since = req.params.since;
    const pool = getPool();

    try {
        let query = `
            SELECT 
                SUM(status = 'Pending') AS pendingCount,
                SUM(status = 'In Progress') AS inProgressCount,
                SUM(status = 'Completed') AS completedCount,
                SUM(status = 'Overdue') AS overdueCount,
                SUM(status = 'Cancelled') AS cancelledCount,
                SUM(isArchived = 1) AS archivedCount
            FROM tasks
            WHERE assignedTo = ?
        `;

        const params = [userId];

        if(since){
            query += ' AND updated_at > ? ';
            params.push(new Date(since));
        }

        const [rows] = await pool.query(query, params);

        const taskQuery = `
            SELECT 
                id,
                title,
                status,
                endDate,
                updated_at AS updatedAt,
                isArchived
            FROM tasks
            WHERE assignedTo = ?
            ${since ? 'AND updated_at > ?' : ''}
        `;

        const [ tasks ] = await pool.query(taskQuery, params);

        const categorizedTasks = {
            pendingTasks: [],
            inProgressTasks: [],
            completedTasks: [],
            cancelledTasks: [],
            overdueTasks: [],
            archivedTasks: [],
        };

        const now = new Date();

        tasks.forEach(task => {
            const taskInfo = {
                id: task.id,
                title: task.title,
                endDate: task.endDate
            };

            switch (task.status) {
                case 'Pending':
                    categorizedTasks.pendingTasks.push(taskInfo);
                    break;
                case 'In Progress':
                    categorizedTasks.inProgressTasks.push(taskInfo);
                    break;
                case 'Completed':
                    categorizedTasks.completedTasks.push(taskInfo);
                    break;
                case 'Cancelled':
                    categorizedTasks.cancelledTasks.push(taskInfo);
                    break;
                case 'Overdue':
                    categorizedTasks.overdueTasks.push(taskInfo);
                    break;
                default:
                    break;
            }

            if(task.isArchived){
                categorizedTasks.archivedTasks.push(taskInfo);
            }
        });

        let lastUpdated = null;
        if(tasks.length > 0){
            const timestamps = tasks.map(t => new Date(t.updatedAt).getTime());
            lastUpdated = new Date(Math.max(...timestamps));   
        }

        const [archivedRows] = await pool.query(`
                SELECT COUNT(*) AS totalArchived
                FROM tasks 
                WHERE assignedTo = ? AND isArchived = 1
                ${since ? 'AND updated_at > ?' :  ''}
            `, since ? [userId, new Date(since)] : [userId]);

        res.json({ 
            ...rows[0],
            ...categorizedTasks, 
            totalArchived: archivedRows[0].totalArchived, 
            lastUpdated: lastUpdated ? lastUpdated.toISOString() : new Date().toISOString
        });

    } catch (error) {
        console.error('Error Fetching Task Counts', error);
        res.status(500).json({ error: 'Internal Sever Error' });
    }
});

router.get("/employees/:office", async (req, res) => {
    const { office } = req.params;

    if (!office) {
        return res.status(400).json({ message: "Office ID is required." });
    }

    try {
        const pool = getPool();
        const [employeeRows] = await pool.query(
            "SELECT id, firstName, lastName, role, office FROM users WHERE office = ? AND role = 'Employee'", 
            [office]
        );

        if (employeeRows.length === 0) {
            return res.json([]);
        }

        const formattedEmployees = employeeRows.map(employee => ({
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
            office: employee.office
        }));

        res.json(formattedEmployees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ message: "Server error while fetching employees." });
    }
});

router.post("/", async (req, res) => {
    const { title, description, startDate, endDate, status = "Pending", assignedTo, createdBy } = req.body;

    if (!title || !startDate || !endDate || !createdBy) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const pool = getPool();
        const [managerRows] = await pool.query("SELECT office, role, firstName, lastName, profilePic FROM users WHERE id = ?", [createdBy]);
        if (managerRows.length === 0) {
            return res.status(404).json({ message: "Manager not found." });
        }

        const { office: managerOffice, role: managerRole, firstName: managerFirstName, lastName: managerLastName } = managerRows[0];
        const managerFullName = `${managerFirstName} ${managerLastName}`;

        let assignedUserId = assignedTo || createdBy;

        if (managerRole === "Manager" && assignedTo) {
            const [employeeRows] = await pool.query("SELECT office, firstName, lastName FROM users WHERE id = ?", [assignedTo]);
                if (employeeRows.length === 0) {
                    return res.status(404).json({ message: "Assigned employee not found." });
                }
                if (employeeRows[0].office !== managerOffice) {
                    return res.status(403).json({ message: "Managers can only assign tasks to employees within their office." });
                }
        }
        const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
        const formattedDueDate = new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });        
        const [result] = await pool.query(
            "INSERT INTO tasks (title, description, startDate, endDate, status, assignedTo, createdBy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            [title, description, formattedStartDate, formattedEndDate, status, assignedUserId, createdBy]
        );
        const taskId = result.insertId;
        if(assignedUserId === createdBy) {
            await pool.query(
                `INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
                [
                    `created task <b>"${title}"</b> with status <span style="font-weight: bold; color: ${getStatusColor(status)}">"${status.toLowerCase()}".</span>`, 
                    createdBy, 
                    null, 
                    taskId
                ]
            );
        } else {
            const [employeeRows] = await pool.query(
                `SELECT firstName, lastName, profilePic FROM users WHERE id = ?`,
                [assignedTo]
            );
            const employeeFullName = employeeRows.length > 0
                ? `${employeeRows[0].firstName} ${employeeRows[0].lastName}`
                : 'a team member';

            await pool.query(
                `INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
                [
                    `assigned task <b>"${title}"</b> with status <span style="font-weight: bold; color: ${getStatusColor(status)}">"${status.toLowerCase()}",</span> to employee <b>${employeeFullName}</b>.`, 
                    createdBy,
                    assignedTo, 
                    taskId
                ]
            );
        }
        if(assignedUserId === createdBy){
            await createNotification(
                createdBy, 
                `Created A Personal Task: <b>"${title}"</b>.<br>` +
                `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span><br>` +
                `- Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span>`, 
                taskId, 
                'task_self_assigned'
            );
        } else {
            const [employeeRows] = await pool.query(
                `SELECT firstName, lastName, profilePic FROM users WHERE id = ?`,
                [assignedTo]
            );
            const employeeFullName = employeeRows.length > 0
                ? `${employeeRows[0].firstName} ${employeeRows[0].lastName}`
                : 'a team member';

            await createNotification(
                assignedTo, 
                `<b>${managerFullName}</b> assigned a task: <b>"${title}"</b>.<br>` +
                `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span><br>` +
                `- Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span>`, 
                taskId, 
                'task_assigned'
            );
            
            await createNotification(
                createdBy, 
                `Assigned task <b>"${title}"</b> to <b>${employeeFullName}</b>.<br>` +
                `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span><br>` +
                `- Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span>`, 
                taskId, 
                'task_assignment_confirmation'
            );
        }

        res.status(201).json({ message: "Task assigned successfully!", taskId: result.insertId, notificationSent: true });

    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ message: "Server error while assigning task." });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    let { title, description, startDate, endDate, status, createdBy, assignedTo } = req.body;
    const completedBy = createdBy || assignedTo;


    if (!title || !description || !startDate || !endDate || !status) {
        return res.status(400).json({ message: "Missing required fields in update request." });
    }

    try {
        const pool = getPool();

        const [taskExists] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
        if (taskExists.length === 0) {
            return res.status(404).json({ message: "Task not found." });
        }

        const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
        const formattedDueDate = new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const today = new Date().toISOString().split("T")[0];
        const [result] = await pool.query(
            "UPDATE tasks SET title = ?, description = ?, startDate = ?, endDate = ?, status = ?, assignedTo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
            [title, description, formattedStartDate, formattedEndDate, status, assignedTo, id]
        );

        await pool.query(`
            INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
            [`updated task <b>"${title}"</b> with status <span style="font-weight: bold; color: ${getStatusColor(status)}">"${status.toLowerCase()}".</span>`, completedBy, null, id]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "Failed to update task. No rows affected." });
        }

        const [createdByRows] = await pool.query(
            `SELECT firstName, lastName FROM users WHERE id = ?`,
            [createdBy]
        );
        const createdByFullName = createdByRows.length > 0 
            ? `${createdByRows[0].firstName} ${createdByRows[0].lastName}`
            : 'System';

        const [assignedToRows] = await pool.query(
            `SELECT firstName, lastName FROM users WHERE id = ?`,
            [assignedTo]
        );
        const assignedToFullName = assignedToRows.length > 0
            ? `${assignedToRows[0].firstName} ${assignedToRows[0].lastName}`
            : 'a team member';

        if (completedBy === createdBy) {
            if (assignedTo === createdBy) {
                await createNotification(
                    createdBy,
                    `Updated your personal task: <b>"${title}"</b>.<br>` +
                    `- New Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span><br>` +
                    `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span>`,
                    id,
                    'task_updated'
                );
            } else {
                await createNotification(
                    createdBy,
                    `Updated task <b>"${title}"</b> assigned to <b>${assignedToFullName}</b>.<br>` +
                    `- New Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span><br>` +
                    `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span>`,
                    id,
                    'task_updated'
                );
                
                await createNotification(
                    assignedTo,
                    `<b>${createdByFullName}</b> updated your assigned task: <b>"${title}"</b>.<br>` +
                    `- New Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span><br>` +
                    `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span>`,
                    id,
                    'task_updated'
                );
            }
        } else {
            await createNotification(
                createdBy,
                `<b>${assignedToFullName}</b> updated task <b>"${title}"</b>.<br>` +
                `- New Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span><br>` +
                `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span>`,
                id,
                'task_updated'
            );
            
            await createNotification(
                assignedTo,
                `You updated task <b>"${title}"</b>.<br>` +
                `- New Status: <span style="font-weight: bold; color: ${getStatusColor(status)}">${status}</span><br>` +
                `- Due Date: <span style="font-weight: bold; color: #C41E3A;">${formattedDueDate}</span>`,
                id,
                'task_updated'
            );
        }

        res.json({ message: "Task updated successfully." });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error while updating task." });
    }
});

router.delete("/:id", async (req, res) => {
    const pool = getPool();
    const { id } = req.params;

    try {
        const [task] = await pool.query("SELECT title, status, createdBy FROM tasks WHERE id = ?", [id]);
        if(task.length === 0){
            return res.status(404).json({ message: "Task not found." });
        }

        const { title, status, createdBy } = task[0];
        await pool.query(
            `INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
            [`deleted task <b>"${title}"</b> with status <span style="font-weight: bold; color: ${getStatusColor(status)}">"${status.toLowerCase()}".</span>`, createdBy, null, id]
        );

        const [result] = await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "Failed to Delete Task." });
        }

        res.json({ message: "Task deleted successfully." });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error while deleting task." });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const pool = getPool();
    try {
        const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Task not found." });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching task by ID:", error);
        res.status(500).json({ message: "Server error while fetching task." });
    }
});

module.exports = router;