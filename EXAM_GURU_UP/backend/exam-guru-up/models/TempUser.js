const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    email: String,
    password: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    subCategory: String,
    token: String,
    expiresAt: Date,
    verificationToken: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        default: () => Date.now() + 10 * 60 * 1000
    }
});

module.exports = mongoose.model("TempUser", tempUserSchema);
