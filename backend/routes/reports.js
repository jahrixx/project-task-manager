const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
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
    let { startDate, endDate, userId } = req.body;

    if (!startDate || !endDate || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const adjustDate = (dateStr) => {
            const date = new Date(dateStr);
            date.setDate(date.getDate() + 1);
            return date.toISOString().split('T')[0];
        };
        const adjustedStartDate = adjustDate(startDate);
        const adjustedEndDate = adjustDate(endDate);
        const [tasks] = await pool.query(`
            SELECT 
                t.id, 
                t.title, 
                t.description, 
                DATE_FORMAT(t.startDate, '%Y-%m-%d') as startDate,
                DATE_FORMAT(t.endDate, '%Y-%m-%d') as endDate,
                t.status,
                t.assignedTo,
                t.createdBy,
                u1.firstName as assignedToFirstName,
                u1.lastName as assignedToLastName,
                u1.office as assignedToOffice,
                u2.firstName as createdByFirstName,
                u2.lastName as createdByLastName,
                u2.office as createdByOffice
            FROM tasks t
            LEFT JOIN users u1 ON t.assignedTo = u1.id
            LEFT JOIN users u2 ON t.createdBy = u2.id
            WHERE (t.createdBy = ? OR t.assignedTo = ?) 
            AND (
                (t.startDate BETWEEN ? AND ?) OR 
                (t.endDate BETWEEN ? AND ?) OR 
                (t.startDate <= ? AND t.endDate >= ?)
            )
        `, [userId, userId, 
            adjustedStartDate, adjustedEndDate,
            adjustedStartDate, adjustedEndDate,
            adjustedStartDate, adjustedEndDate]);

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for the adjusted date range." });
        }

        const formattedTasks = tasks.map(task => ({
            ...task,
            assignedToName: `${task.assignedToFirstName} ${task.assignedToLastName}`,
            createdByName: `${task.createdByFirstName} ${task.createdByLastName}`,
            office: task.assignedToOffice || task.createdByOffice || 'No office specified'
        }));

        const report = {
            title: `Task Report ${adjustedStartDate} to ${adjustedEndDate}`,
            startDate: adjustedStartDate,
            endDate: adjustedEndDate,
            userId
        };

        const [result] = await pool.query(`INSERT INTO reports SET ?`, report);
        res.json({ 
            message: "Report generated successfully", 
            reportId: result.insertId,
            tasks: formattedTasks,
            adjustedStartDate,
            adjustedEndDate
        });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ 
            message: "Error generating report", 
            error: error.message,
            adjustedStartDate,
            adjustedEndDate
        });
    }
});

router.post("/download", async (req, res) => {
    console.log("Download report called");
    const pool = getPool();
    const { reportId, startDate, endDate, downloaderId } = req.body;

    if (!startDate || !endDate || !downloaderId) {
        return res.status(400).json({ 
            message: "Start date, end date, and downloader ID are required." 
        });
    }

    try {
        // Fetch report and user data
        const [reportData] = await pool.query(`
            SELECT 
                r.*, 
                creator.firstName as creatorFirstName,
                creator.lastName as creatorLastName,
                creator.role as creatorRole,
                creator.office as creatorOffice,
                downloader.firstName as downloaderFirstName,
                downloader.lastName as downloaderLastName,
                downloader.role as downloaderRole
            FROM reports r
            JOIN users creator ON r.userId = creator.id
            JOIN users downloader ON downloader.id = ?
            WHERE r.id = ?
        `, [downloaderId, reportId]);

        if (reportData.length === 0) {
            return res.status(404).json({ message: "Report not found." });
        }
        const report = reportData[0];

        // Fetch tasks
        const [tasks] = await pool.query(
            `SELECT 
                t.id, 
                t.title, 
                t.description, 
                t.status, 
                t.startDate, 
                t.endDate,
                CONCAT(u1.firstName, ' ', u1.lastName) as assignedToName,
                CONCAT(u2.firstName, ' ', u2.lastName) as createdByName,
                u1.office as office
            FROM tasks t
            LEFT JOIN users u1 ON t.assignedTo = u1.id
            LEFT JOIN users u2 ON t.createdBy = u2.id
            WHERE (t.createdBy = ? OR t.assignedTo = ?) 
            AND (
                (t.startDate BETWEEN ? AND ?) OR 
                (t.endDate BETWEEN ? AND ?) OR 
                (t.startDate <= ? AND t.endDate >= ?)
            )
             ORDER BY startDate ASC`,
            [report.userId, report.userId, startDate, endDate, startDate, endDate, startDate, endDate]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found in the selected date range." });
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        // Load font (using built-in Helvetica for simplicity)
        const font = pdfDoc.embedStandardFont('Helvetica');
        const fontBold = pdfDoc.embedStandardFont('Helvetica-Bold');

        // Add a page
        const page = pdfDoc.addPage([595, 842]); // A4 size in points

        // Define table parameters
        const tableWidth = 540;
        const columnWidths = [30, 70, 75, 75, 130, 80, 50]; 
        const columnHeaders = ['ID', 'TITLE', 'ASSIGNED TO', 'CREATED BY', 'DESCRIPTION', 'DURATION', 'STATUS'];
        const rowHeight = 25;

        // Set up initial coordinates
        let y = 800; // Start near the top of the page
        const margin = 20;
        const lineHeight = 15;

        // Add title
        const title = `TASK REPORT - ${new Date(startDate).toLocaleDateString('en-CA')} to ${new Date(endDate).toLocaleDateString('en-CA')}`;
        const titleWidth = font.widthOfTextAtSize(title, 20);
        const centerX = margin + (tableWidth / 2) - (titleWidth / 2);

        page.drawText(title, {
            x: centerX,
            y,
            size: 20,
            font: fontBold,
        });
        y -= lineHeight * 2;

        const metadata = [
            { label: 'Report By:', value: `${report.creatorFirstName} ${report.creatorLastName} - ${report.creatorRole}` },
            { label: 'Office:', value: report.creatorOffice },
            { label: 'Report Generated By:', value: `${report.downloaderFirstName} ${report.downloaderLastName} - ${report.downloaderRole}` },
            { label: 'Report Period:', value: `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` },
            { label: 'Generated On:', value: new Date().toLocaleDateString() },
        ];

        metadata.forEach((data) => {
            page.drawText(data.label, {
                x: margin,
                y,
                size: 10,
                font: fontBold, // Bold label
            });
        
            page.drawText(data.value, {
                x: margin + 120, // Adjusted spacing for alignment
                y,
                size: 10,
                font, // Regular font for values
            });
        
            y -= lineHeight; // Move to the next line
        });

        let x = margin;
        columnHeaders.forEach((header, i) => {
            page.drawText(header, {
                x: x + 5,
                y: y - 12,
                size: 9,
                font: fontBold,
                maxWidth: columnWidths[i],
            });
            x += columnWidths[i];
        });
        y -= rowHeight;

        // Draw horizontal line under header
        page.drawLine({
            start: { x: margin, y: y + 5 },
            end: { x: margin + tableWidth, y: y + 5 },
            thickness: 0.5,
        });

        y -= 5;

        // Draw task rows
        tasks.forEach((task, i) => {
            if (y < 100) { // Add new page if running out of space
                page = pdfDoc.addPage([595, 842]);
                y = 800;
            }

            // Draw cell content
            x = margin;
            const cellContent = [
                task.id.toString(),
                task.title,
                task.assignedToName || 'Unassigned',
                task.createdByName || 'Unknown',
                task.description || 'No description',
                `${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}` || 'No date range',
                task.status.toUpperCase()
            ];

            let maxLineCount = 1;

            cellContent.forEach((content, colIndex) => {
                const lines = splitTextIntoLines(content, columnWidths[colIndex] - 10, font, 9);
                maxLineCount = Math.max(maxLineCount, lines.length);
                
                lines.forEach((line, lineIndex) => {
                    page.drawText(line, {
                        x: x + 5,
                        y: y - 10 - (lineIndex * 10),
                        size: 9,
                        font,
                        maxWidth: columnWidths[colIndex] - 10,
                    });
                });
                
                x += columnWidths[colIndex];
            });

            y -= rowHeight + (maxLineCount - 1) * 10; 

            // Draw horizontal line between rows
            page.drawLine({
                start: { x: margin, y: y + 5 }, // Moved closer to text
                end: { x: margin + tableWidth, y: y + 5 },
                thickness: 0.5,
            });
        });

        // Save PDF to file
        const pdfBytes = await pdfDoc.save();
        const reportsDir = path.join(__dirname, "../reports");
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const filePath = path.join(reportsDir, `${reportId}_${Date.now()}.pdf`);
        fs.writeFileSync(filePath, pdfBytes);

        res.download(filePath, `TaskReport_${report.creatorFirstName}_${report.creatorLastName}.pdf`, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ message: "Error downloading file" });
            }
            // Optionally delete file after sending
            // fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ 
            message: "Error generating report", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

function splitTextIntoLines(text, maxWidth, font, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    
    // Ensure we don't return empty lines
    return lines.filter(line => line.trim().length > 0);
}

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