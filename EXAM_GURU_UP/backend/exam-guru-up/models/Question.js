const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    question: {
        type: String,
        required: true
    },

    options: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true }
    },

    correctAnswer: {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    // 🔥 Category Reference
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    // 🔥 Sub Category String (Dynamic)
    subCategory: {
        type: String,
        required: true
    },
     subject: {
        type: String,
        required: true
    },


    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Easy"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Question", questionSchema);
