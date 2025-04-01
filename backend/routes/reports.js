const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const express = require("express");
const { getPool } = require("../db");

const router = express.Router();

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

    console.log("Received report request:", { startDate, endDate, userId });

    try {
        const [tasks] = await pool.query(`
            SELECT 
                id, 
                title, 
                description, 
                startDate, 
                endDate, 
                status,
                assignedTo,
                createdBy
            FROM tasks 
            WHERE (createdBy = ? OR assignedTo = ?) 
            AND (
                (startDate BETWEEN ? AND ?) OR 
                (endDate BETWEEN ? AND ?) OR 
                (startDate <= ? AND endDate >= ?)
            )
        `, [userId, userId, startDate, endDate, startDate, endDate, startDate, endDate]);

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
        res.json({ 
            message: "Report generated successfully", 
            reportId: result.insertId,
            tasks 
        });
    } catch (error) {
        res.status(500).json({ message: "Error generating report", error });
    }
});

router.post("/download", async (req, res) => {
    console.log("Download report called");
    const pool = getPool();
    const { reportId, startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required." });
    }

    try {
        const reportsDir = path.join(__dirname, "../reports");
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Fetch report and user data
        const [reportData] = await pool.query(`
            SELECT r.*, u.firstName, u.lastName, u.role, u.office
            FROM reports r
            JOIN users u ON r.userId = u.id
            WHERE r.id = ?
        `, [reportId]);

        if (reportData.length === 0) {
            return res.status(404).json({ message: "Report not found." });
        }
        const report = reportData[0];

        // Fetch tasks
        const [tasks] = await pool.query(
            `SELECT id, title, description, status, startDate, endDate 
             FROM tasks 
             WHERE (createdBy = ? OR assignedTo = ?) 
             AND (
                 (startDate BETWEEN ? AND ?) OR 
                 (endDate BETWEEN ? AND ?) OR 
                 (startDate <= ? AND endDate >= ?)
             )
             ORDER BY startDate ASC`,
            [report.userId, report.userId, startDate, endDate, startDate, endDate, startDate, endDate]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found in the selected date range." });
        }

        // Create PDF document with better styling
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filePath = path.join(reportsDir, `${reportId}_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

         // ===== HEADER =====
        doc.fillColor('#2c3e50') // Darker color for header
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('TASK COMPLETION REPORT', { align: 'center' })
        .moveDown(0.5);

        // ===== REPORT METADATA =====
        doc.fillColor('#34495e') // Darker color for metadata
        .fontSize(12)
        .font('Helvetica')
        .text(`Report By: ${report.firstName} ${report.lastName} - (${report.role})`, { align: 'left' })
        .text(`Office: ${report.office}`, { align: 'left' })
        .text(`Report Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: 'left' })
        .text(`Generated On: ${new Date().toLocaleDateString()}`, { align: 'left' })
        .moveDown(0.5);

        // ===== TASK TABLE =====
        const tableTop = doc.y + 10; // Start table below the metadata
        const tableWidth = 500;
        const columnWidths = [40, 100, 180, 100, 80]; // Adjusted column widths
        const columnHeaders = ['ID', 'TITLE', 'DESCRIPTION', 'DATES', 'STATUS'];
        const headerHeight = 25;
        const rowHeight = 22;

        // Table Header
        doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#ffffff')
        .rect(50, tableTop, tableWidth, headerHeight)
        .fill('#3498db'); // Blue header

        let x = 50;
        columnHeaders.forEach((header, index) => {
        doc.fillColor('#ffffff')
            .text(header, x + 5, tableTop + 10, { width: columnWidths[index], align: 'left' });
        x += columnWidths[index];
        });

        // Task Rows
        let y = tableTop + headerHeight;
        tasks.forEach((task, i) => {
        x = 50;
        doc.font('Helvetica')
            .fontSize(10)
            .fillColor(i % 2 ? '#ecf0f1' : '#ffffff') // Light gray or white rows
            .rect(50, y, tableWidth, rowHeight)
            .fill();

        const taskData = [
            task.id.toString(),
            task.title,
            task.description,
            `${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}`,
            task.status.toUpperCase(),
        ];

        taskData.forEach((data, index) => {
            doc.fillColor('#333')
            .text(data, x + 5, y + 8, { width: columnWidths[index], align: 'left' });
            x += columnWidths[index];
        });

        y += rowHeight;
        });

        doc.end();

        // Wait for stream to finish writing
        await new Promise((resolve) => stream.on('finish', resolve));

        // Send file
        res.download(filePath, `TaskReport_${report.firstName}_${report.lastName}.pdf`, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ message: "Error downloading file" });
            }
            // Optionally delete file after sending
            // fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: "Error generating report", error });
    }
});

router.get("/tasks", async (req, res) => {
    const pool = getPool();
    const { assignedTo } = req.query;

    let query = "SELECT * FROM tasks";
    let values = [];

    if (assignedTo) {
        query += " WHERE assignedTo = ?";
        values.push(assignedTo);
    }

    try {
        const [tasks] = await pool.execute(query, values);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

// Serve reports as static files
// router.use("/reports", express.static(reportsDir));

module.exports = router;