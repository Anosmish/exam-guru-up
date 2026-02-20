const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    subCategory: {
        type: String
    },
    resetToken: String,
    resetTokenExpiry: Date,

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
});

module.exports = mongoose.model("User", userSchema);
