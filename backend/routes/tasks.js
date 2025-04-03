const express = require("express");
const router = express.Router();
const { updateTaskStatuses } = require("./services/taskService");
const { getPool } = require("../db");

// GET: Fetch tasks with filtering based on the requester
router.get("/", async (req, res) => {
    const { userId, role, office } = req.query;
    const numericUserId = Number(userId);
    const pool = getPool();

    console.log("GET /tasks called with:", { userId, role, office, numericUserId });

    let baseQuery = `
        SELECT tasks.id, 
               tasks.title, 
               tasks.description, 
               DATE_FORMAT(tasks.startDate, '%Y-%m-%d') AS startDate, 
               DATE_FORMAT(tasks.endDate, '%Y-%m-%d') AS endDate, 
               tasks.status,
               tasks.createdBy,
               tasks.assignedTo, 
               CONCAT(u1.firstName, ' ', u1.lastName) AS assignedToName, 
               CONCAT(u2.firstName, ' ', u2.lastName) AS createdByName, 
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
    
    console.log("Executing Query:", baseQuery);
    console.log("With Parameters:", queryParams);

    try {
        await updateTaskStatuses();

        const [tasks] = await pool.query(baseQuery, queryParams);
        console.log("Tasks Retrieved:", tasks);

        if(role === "Admin"){
            const groupedTasks = tasks.reduce((acc, task) => {
                if(!acc[task.creatorOffice]) {
                    acc[task.creatorOffice] = [];
                }
                acc[task.creatorOffice].push(task);
                return acc;
            }, {});

            // console.log("Tasks Retrieved (Grouped By Office):", groupedTasks);
            res.json(groupedTasks);
        } else {
            console.log("Tasks Retrieved: ", tasks);
            res.json(tasks);
        }
    } catch (error) {
        console.error("Error fetching tasks from MySQL:", error);
        res.status(500).json({ message: "Server error while fetching tasks." });
    }
});

router.get("/status-count/:assignedTo", async (req, res) => {
    // const counts = {};
    const userId = req.params.assignedTo;
    const since = req.params.since;
    const pool = getPool();

    try {
        let query = `
            SELECT 
                SUM(status = 'Pending') AS pendingCount,
                SUM(status = 'In Progress') AS inProgressCount,
                SUM(status = 'Completed') AS completedCount
            FROM tasks
            WHERE assignedTo = ?
        `;

        const params = [userId];

        if(since){
            query += ' AND updated_at > ? ';
            params.push(new Date(since));
        }

        const [rows] = await pool.query(query, params);
            res.json({ ...rows[0], lastUpdated: new Date().toISOString() });

    } catch (error) {
        console.error('Error Fetching Task Counts', error);
        res.status(500).json({ error: 'Internal Sever Error' });
    }
});

// Add a new route to fetch employees in the same office
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

        // Format the employee data for display in the dropdown
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

// POST: Create a new task (Managers can only assign to employees in the same office)
router.post("/", async (req, res) => {
    const { title, description, startDate, endDate, status = "Pending", assignedTo, createdBy } = req.body;

    if (!title || !startDate || !endDate || !createdBy) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const pool = getPool();

        // Fetch manager's office and role
        const [managerRows] = await pool.query("SELECT office, role FROM users WHERE id = ?", [createdBy]);
        if (managerRows.length === 0) {
            return res.status(404).json({ message: "Manager not found." });
        }

        const { office: managerOffice, role: managerRole } = managerRows[0];

        let assignedUserId = assignedTo || createdBy;

        if (managerRole === "Manager" && assignedTo) {
            // Check if the assigned employee belongs to the same office
            const [employeeRows] = await pool.query("SELECT office FROM users WHERE id = ?", [assignedTo]);

            if (employeeRows.length === 0) {
                return res.status(404).json({ message: "Assigned employee not found." });
            }
            if (employeeRows[0].office !== managerOffice) {
                return res.status(403).json({ message: "Managers can only assign tasks to employees within their office." });
            }
        }

        const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
        
        // Insert new task (insert timestamps)
        const [result] = await pool.query(
            "INSERT INTO tasks (title, description, startDate, endDate, status, assignedTo, createdBy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            [title, description, formattedStartDate, formattedEndDate, status, assignedUserId, createdBy]
        );

        console.log("Created Task Start Date", formattedStartDate)
        console.log("Created Task End Date", formattedEndDate)

        const taskId = result.insertId;

        // create task insert to activities table
        await pool.query(
            "INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?, ?, ?, ?)",
            [`created task ${title} with status ${status.toLowerCase()}`, createdBy, assignedTo, taskId]
        );
        res.status(201).json({ message: "Task assigned successfully!", taskId: result.insertId });

    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ message: "Server error while assigning task." });
    }
});

// PUT: Update an existing task
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    let { title, description, startDate, endDate, status, createdBy, assignedTo } = req.body;
    const completedBy = createdBy || assignedTo;

    console.log(startDate, endDate);

    if (!title || !description || !startDate || !endDate || !status) {
        return res.status(400).json({ message: "Missing required fields in update request." });
    }

    try {
        const pool = getPool();

        const [taskExists] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
        if (taskExists.length === 0) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Convert dates to MySQL-friendly format
        const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
        const today = new Date().toISOString().split("T")[0];

        // if(formattedEndDate === today){
        //     status = "Due Date";
        // } else if(formattedEndDate < today){
        //     status = "Overdue";
        // };

        //(insert timestamps)
        const [result] = await pool.query(
            "UPDATE tasks SET title = ?, description = ?, startDate = ?, endDate = ?, status = ?, assignedTo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
            [title, description, formattedStartDate, formattedEndDate, status, assignedTo, id]
        );
        
        console.log("Updated Task Start Date", formattedStartDate)
        console.log("Updated Task End Date", formattedEndDate)
        console.log("Updated Task Status", status)

        // insert activity table 
        await pool.query(`
            INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
            [`updated task ${title} with status ${status.toLowerCase()}`, completedBy, null, id]);
    
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "Failed to update task. No rows affected." });
        }
        res.json({ message: "Task updated successfully." });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error while updating task." });
    }
});

// DELETE: Remove a task
router.delete("/:id", async (req, res) => {
    const pool = getPool();
    const { id } = req.params;

    try {
        const [task] = await pool.query("SELECT title, status, createdBy FROM tasks WHERE id = ?", [id]);
        if(task.length === 0){
            return res.status(404).json({ message: "Task not found." });
        }

        const { title, status, createdBy } = task[0];
        // insert to activities table
        await pool.query(
            `INSERT INTO activities (message, createdBy, assignedTo, taskId) VALUES (?,?,?,?)`,
            [`deleted task ${title} with status ${status.toLowerCase()}`, createdBy, null, id]
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

// GET: Fetch a single task by ID
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