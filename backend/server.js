const express = require("express");
const cors = require("cors");
const schedule = require('node-schedule');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const { updateTaskStatuses } = require("./routes/services/taskService");

// Import Routes
const rolesRoutes = require("./routes/roles");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const officeRoutes = require("./routes/offices");
const activitiesRoutes = require("./routes/activities");
const reportsRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
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
app.use('/uploads', express.static('uploads'));
// app.use("/api/reports", reportRoutes);

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
    console.log(`Server running on http://localhost:${PORT}`);
});