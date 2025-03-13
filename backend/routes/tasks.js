const express = require("express");
const { getPool } = require("../db");
const router = express.Router();

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
               tasks.startDate, 
               tasks.endDate, 
               tasks.status,
               tasks.createdBy,
               tasks.assignedTo, 
               u1.firstName AS assignedToName, 
               u2.firstName AS createdByName, 
               u2.role AS creatorRole, 
               u2.office AS creatorOffice
        FROM tasks
        LEFT JOIN users u1 ON tasks.assignedTo = u1.id
        LEFT JOIN users u2 ON tasks.createdBy = u2.id
    `;
    const queryParams = [];
    let conditions = [];

    if (userId && role) {
        if (role === "Manager") {
            // For Managers: show tasks they created, tasks assigned to them,
            // and tasks assigned to employees in the same office.
            conditions.push(`
                    (
                        (tasks.createdBy = tasks.assignedTo AND tasks.createdBy = ?) OR
                        (tasks.assignedTo = ?) OR
                        (u1.role = 'Employee' AND UPPER(u1.office) = UPPER(?))
                    )
                `);
            
            // conditions.push(
            //     "(tasks.createdBy = ? OR tasks.assignedTo = ? OR (u1.role = 'Employee' AND UPPER(u1.office) = UPPER(?)))"
            // );
            queryParams.push(numericUserId, numericUserId, office.trim());
        } else if (role === "Employee") {
            // For Employees: show tasks where they are either the creator or the assignee.
            // conditions.push("(tasks.createdBy = ? OR tasks.assignedTo = ?)");
            conditions.push(`
                    (tasks.createdBy = ? OR tasks.assignedTo = ?)
                `)
            queryParams.push(numericUserId, numericUserId);
        }
    }

    if (conditions.length > 0) {
        baseQuery += " WHERE " + conditions.join(" AND ");
    }
    
    console.log("Executing Query:", baseQuery);
    console.log("With Parameters:", queryParams);

    try {
        const [tasks] = await pool.query(baseQuery, queryParams);
        console.log("Tasks Retrieved:", tasks);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks from MySQL:", error);
        res.status(500).json({ message: "Server error while fetching tasks." });
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

        // Insert new task
        const [result] = await pool.query(
            "INSERT INTO tasks (title, description, startDate, endDate, status, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, description, startDate, endDate, status, assignedUserId, createdBy]
        );

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
    const { title, description, startDate, endDate, status, createdBy, assignedTo } = req.body;
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
        const [result] = await pool.query(
            "UPDATE tasks SET title = ?, description = ?, startDate = ?, endDate = ?, status = ?, assignedTo = ? WHERE id = ?",
            [title, description, startDate, endDate, status, assignedTo, id]
        );
                
        // insert into activity table
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