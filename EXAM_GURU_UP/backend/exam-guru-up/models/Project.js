const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    subCategory: String,
    type: String, // web, iot, final-year
    title: String,
    description: String,
    pdfUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);