const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema({
    subCategory: String,
    subject: String,
    semester: Number,
    year: Number,
    title: String,
    pdfUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Paper", paperSchema);