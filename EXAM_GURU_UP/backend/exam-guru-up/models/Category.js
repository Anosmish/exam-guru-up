const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: String,
    dashboard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard"
},

    subCategories: [
        {
            name: String,
            subjects: [String]
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
