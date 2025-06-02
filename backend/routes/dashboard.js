const express = require("express");
const router = express.Router();
const { getPool } = require("../db");

router.get("/", async (req, res) => {
    const pool = getPool();
    try {
        const [employees] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Employee'");
        const [managers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Manager'");
        const [offices] = await pool.query("SELECT DISTINCT office FROM users WHERE office IS NOT NULL AND office != ''");
        const [employeesList] = await pool.query(`
            SELECT 
                id, 
                CONCAT(firstName, ' ', lastName) AS name, 
                office AS officeName
            FROM users
            WHERE role = 'Employee'
        `);
        const [managersList] = await pool.query(`
            SELECT 
                id, 
                CONCAT(firstName, ' ', lastName) AS name, 
                office AS officeName
            FROM users
            WHERE role = 'Manager'
        `);
        const officesList = offices.map((o, index) => ({
            id: index + 1,
            name: o.office
        }));
        res.json({
            employees: employees[0].count,
            managers: managers[0].count,
            offices: offices.length,
            employeesList: employeesList,
            managersList: managersList,
            officesList: officesList
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
module.exports = router;
