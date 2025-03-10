const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "project_tasks_manager",
};

let pool;

async function createAndConnect() {
    if (!pool) {
        try {
            const connection = await mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
            });

            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
            await connection.end();

            pool = mysql.createPool({
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
            });

            console.log("✅ Connected to Database");
        } catch (err) {
            console.error("❌ Error creating database or connecting:", err);
            throw err;
        }
    }
    return pool;
}

async function createTables() {
    try {
        const pool = await createAndConnect();
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                office VARCHAR(255),
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                number VARCHAR(11),
                address VARCHAR(255),
                birthday DATE,
                profilePic VARCHAR(255)
            )
        `);
        console.log("✅ Users table created or already exists.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS office (
                id INT AUTO_INCREMENT PRIMARY KEY,
                officeName VARCHAR(255)
            )
        `);
        console.log("✅ Office table created or already exists.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                description VARCHAR(255),
                startDate DATE,
                endDate DATE,
                status VARCHAR(50),
                assignedTo INT,
                createdBy INT,
                FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Tasks table created or already exists.");
    } catch (err) {
        console.error("❌ Database initialization failed:", err);
    }
}

async function createAdminAccount() {
    try {
        const pool = await createAndConnect();
        const [users] = await pool.query("SELECT * FROM users WHERE username = 'admin'");

        if(users.length === 0){
            const plainPassword = "default123";
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            console.log("Hashed Password: ", hashedPassword);
            await pool.query(
                `INSERT INTO project_tasks_manager.users 
                (username, password, role, office, firstName, lastName, number, address, birthday) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ["admin", hashedPassword, "Admin", "Admin Office", "John", "Doe", "0000000000", "Default Address", "2000-01-01"]
            );
            console.log("Default Admin User Created!");
        } else {
            console.log("Admin User already exists!");
        }
    } catch (err) {
        console.error("Failed to create Admin User", err);
    }
}

(async () => {
    await createAndConnect();
    await createTables();
    await createAdminAccount();
})();

module.exports = { createAndConnect, dbConfig, getPool: () => pool };
