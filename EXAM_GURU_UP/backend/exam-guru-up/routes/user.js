const express = require("express");
const User = require("../models/User");
const Score = require("../models/Score");
const Category = require("../models/Category"); // ✅ IMPORTANT
const verifyToken = require("../middleware/verifyToken");
const bcrypt = require("bcryptjs");

const router = express.Router();


// 👤 ================= GET USER PROFILE =================
router.get("/profile", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate("category")   // 🔥 VERY IMPORTANT
            .select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const scores = await Score.find({ userId });

        const totalAttempts = scores.length;

        const bestScore = scores.length > 0
            ? Math.max(...scores.map(s => s.score))
            : 0;

        const averageScore = scores.length > 0
            ? (
                scores.reduce((sum, s) => sum + s.score, 0)
                / scores.length
              ).toFixed(2)
            : 0;

        res.json({
            user,
            totalAttempts,
            bestScore,
            averageScore
        });

    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// ✏️ ================= UPDATE PROFILE =================
router.put("/update", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id;
        const { name, category, subCategory } = req.body;

        if (!name || !category || !subCategory) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // ✅ Check category exists
        const categoryData = await Category.findById(category);

        if (!categoryData) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        // ✅ Check subCategory valid
       const isValidSubCategory = categoryData.subCategories.some(sub =>
   typeof sub === "object"
      ? sub.name === subCategory
      : sub === subCategory
);

if (!isValidSubCategory) {
   return res.status(400).json({
      message: "Invalid sub category"
   });
}

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name: name.trim(),
                category: category,       // ❌ trim removed
                subCategory: subCategory.trim()
            },
            { new: true }
        )
        .populate("category")   // 🔥 Important
        .select("-password");

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// 🔐 ================= CHANGE PASSWORD =================
router.put("/change-password", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "All fields required" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Old password incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
