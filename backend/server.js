const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Import Routes
const rolesRoutes = require("./routes/roles");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const officeRoutes = require("./routes/offices");
const activitiesRoutes = require("./routes/activities");
const dashboardRoutes = require("./routes/dashboard");
// const reportRoutes = require("./routes/reports");

// Use Routes
app.use("/roles", rolesRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/offices", officeRoutes);
app.use("/activities", activitiesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use('/uploads', express.static('uploads'));
// app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});