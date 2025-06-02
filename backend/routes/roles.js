const express = require("express");
const router = express.Router();
const pool = require("../db");
const roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Manager" },
    { id: 3, name: "Employee" }
];
    router.get("/", (req, res) => {
        res.json(roles);
    });
module.exports = router;