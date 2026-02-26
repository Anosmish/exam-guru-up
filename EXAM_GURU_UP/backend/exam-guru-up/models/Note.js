const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    subCategory: String,     // CSE, ME, Civil (from user.subCategory)
    subject: String,
    semester: Number,
    title: String,
    pdfUrl: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);