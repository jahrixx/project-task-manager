const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const express = require("express");
const router = express.Router();
const { getPool } = require("../db");

router.get("/", async (req, res) => {
    const pool = getPool();
    const { userId, startDate, endDate, office } = req.query;

    try {
        let query = `
            SELECT r.id, 
                   r.title, 
                   r.createdBy, 
                   r.userId, 
                   r.startDate, 
                   r.endDate, 
                   r.pdfPath,
                   u.firstName, 
                   u.lastName, 
                   u.role, 
                   u.office
            FROM reports r
            LEFT JOIN users u ON r.userId = u.id
            WHERE 1=1
        `;

        const params = [];

        if (userId) {
            query += ` AND r.userId = ?`;
            params.push(userId);
        }
        if (startDate && endDate) {
            query += ` AND r.startDate >= ? AND r.endDate <= ?`;
            params.push(startDate, endDate);
        }
        if (office) {
            query += ` AND u.office = ?`;
            params.push(office);
        }

        const [reports] = await pool.query(query, params);
        res.json(reports);

    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/generate', async (req, res) => {
    console.log("Generate report called");
    const pool = getPool();
    const { startDate, endDate, userId, createdBy } = req.body;

    try {
        const [tasks] = await pool.query(`
            SELECT * FROM tasks 
            WHERE createdBy = ? AND startDate >= ? AND endDate <= ?
        `, [userId, startDate, endDate]);

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for the selected range." });
        }

        const report = {
            title: `Task Report ${startDate} - ${endDate}`,
            createdBy,
            startDate,
            endDate,
            userId
        };

        const [result] = await pool.query(`INSERT INTO reports SET ?`, report);
        res.json({ message: "Report generated successfully", reportId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Error generating report", error });
    }
});

router.post('/download', async (req, res) => {
    console.log("Download report called");
    const pool = getPool();
    const { reportId } = req.body;

     // Ensure the reports directory exists
     const reportsDir = path.join(__dirname, '../reports');
     if (!fs.existsSync(reportsDir)) {
         fs.mkdirSync(reportsDir, { recursive: true });
     }

    const [reportData] = await pool.query(`SELECT * FROM reports WHERE id = ?`, [reportId]);
    const [tasks] = await pool.query(`SELECT * FROM tasks WHERE createdBy = ?`, [reportData.userId]);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText(`Task Report: ${reportData.title}`, { x: 50, y: 750 });

    let y = 730;
    tasks.forEach(task => {
        page.drawText(`${task.title} - ${task.status}`, { x: 50, y });
        y -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(reportsDir, `${reportId}.pdf`);
    
    fs.writeFileSync(`./reports/${reportId}.pdf`, pdfBytes);
    res.json({ filePath });

    console.log("Downloaded Report File Path: ", filePath);
    // res.json({ message: "PDF generated", filePath: `/reports/${reportId}.pdf` });
});

module.exports = router;