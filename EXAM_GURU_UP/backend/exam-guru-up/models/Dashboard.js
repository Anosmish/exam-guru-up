const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema(
    {
        name: String,
        route: String,   // ex: ssc-dashboard.html
        description: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("Dashboard", dashboardSchema);
