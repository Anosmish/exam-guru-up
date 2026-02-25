const mongoose = require("mongoose");

const practicalSchema = new mongoose.Schema({
  subCategory: String,
  subject: String,
  semester: Number,
  title: String,
  pdfUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Practical", practicalSchema);