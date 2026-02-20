const express = require("express");
const router = express.Router();
const Dashboard = require("../models/Dashboard");

/* ================= GET ALL DASHBOARDS ================= */
router.get("/", async (req, res) => {
    try {
        const dashboards = await Dashboard.find().sort({ createdAt: -1 });
        res.json(dashboards);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching dashboards" });
    }
});

/* ================= GET SINGLE DASHBOARD ================= */
router.get("/:id", async (req, res) => {
    try {
        const dashboard = await Dashboard.findById(req.params.id);

        if (!dashboard) {
            return res.status(404).json({ message: "Dashboard not found" });
        }

        res.json(dashboard);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching dashboard" });
    }
});

/* ================= ADD DASHBOARD ================= */
router.post("/add", async (req, res) => {
    try {
        const { name, route, description } = req.body;

        if (!name || !route) {
            return res.status(400).json({
                message: "Name and Route are required"
            });
        }

        const exists = await Dashboard.findOne({ name });
        if (exists) {
            return res.status(400).json({
                message: "Dashboard already exists"
            });
        }

        const dash = new Dashboard({
            name,
            route,
            description
        });

        await dash.save();

        res.json({ message: "Dashboard Created Successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error creating dashboard" });
    }
});

/* ================= UPDATE DASHBOARD ================= */
router.put("/:id", async (req, res) => {
    try {
        const { name, route, description } = req.body;

        await Dashboard.findByIdAndUpdate(
            req.params.id,
            { name, route, description }
        );

        res.json({ message: "Dashboard Updated Successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error updating dashboard" });
    }
});

/* ================= DELETE DASHBOARD ================= */
router.delete("/:id", async (req, res) => {
    try {
        await Dashboard.findByIdAndDelete(req.params.id);
        res.json({ message: "Dashboard Deleted Successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error deleting dashboard" });
    }
});

module.exports = router;
