const express = require("express");
const cors = require("cors");
const schedule = require('node-schedule');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { updateTaskStatuses } = require("./routes/services/taskService");
const { router: notificationRoutes } = require("./routes/notification");
const { checkOverdueTasks } = require("./routes/services/overdueChecker");

// Import Routes
const rolesRoutes = require("./routes/roles");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const officeRoutes = require("./routes/offices");
const activitiesRoutes = require("./routes/activities");
const reportsRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const archiveRoutes = require("./routes/archive");
// const notificationRoutes = require("./routes/notification");
// const updateTaskStatuses = require("./routes/services/taskService");
// const reportRoutes = require("./routes/reports");

// Use Routes
app.use("/roles", rolesRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/offices", officeRoutes);
app.use("/activities", activitiesRoutes);
app.use("/reports", reportsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/archive", archiveRoutes);
app.use("/notification", notificationRoutes);
app.use('/uploads', express.static('uploads'));
// app.use("/notification", notificationRoutes);
// app.use("/api/reports", reportRoutes);

setInterval(checkOverdueTasks, 300000);

updateTaskStatuses()
    .then(result => console.log("Initial status update complete: ", result))
        .catch(err => console.error("Failed initial status update: ", err));

schedule.scheduleJob('0 0 * * *', async () => {
    try {
        const result = await updateTaskStatuses();
        console.log("Scheduled status update complete: ", result);

    } catch (error) {
        console.error("Scheduled status update failed: ", error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}`);
});