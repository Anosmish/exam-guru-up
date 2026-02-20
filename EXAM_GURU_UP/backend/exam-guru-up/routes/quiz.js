const express = require("express");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Category = require("../models/Category");

const router = express.Router();

/* ======================================================
   ✅ GENERATE QUIZ
   Category + SubCategory + Subject + Difficulty Wise
====================================================== */

router.get("/generate", async (req, res) => {

    try {
        

       


        const { category, subCategory, subject, difficulty, limit } = req.query;

        if (!category || !subCategory) {
            return res.status(400).json({
                success: false,
                message: "Category and SubCategory are required"
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Category ID"
            });
        }

        // 🎯 Build filter
        const filter = {
            category: new mongoose.Types.ObjectId(category),
            subCategory: subCategory
        };

        if (subject && subject.trim() !== "") {
            filter.subject = subject;
        }

        if (difficulty && difficulty.trim() !== "") {
            filter.difficulty = difficulty;
        }

        const totalQuestions = await Question.countDocuments(filter);
           console.log("Total Questions Found:", totalQuestions);

       
        if (totalQuestions === 0) {
            return res.status(404).json({
                success: false,
                message: "No questions found for selected filter"
            });
        }

        const quizLimit = limit ? parseInt(limit) : 10;

        const questions = await Question.aggregate([
            { $match: filter },
            { $sample: { size: quizLimit } },
            {
                $project: {
                    _id: 1,  
                    question: 1,
                    options: 1,
                    subject: 1,
                    difficulty: 1
                    // 🔥 correctAnswer hidden for security
                }
            }
        ]);

        res.json({
            success: true,
            totalAvailable: totalQuestions,
            questions
        });

    } catch (error) {

        console.error("Quiz Generate Error:", error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

});


/* ======================================================
   ✅ GET SUBCATEGORIES (Category Wise)
====================================================== */

router.get("/subcategories/:categoryId", async (req, res) => {

    try {

        const { categoryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                message: "Invalid Category ID"
            });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const subCategories = category.subCategories.map(sub => sub.name);

        res.json(subCategories);

    } catch (error) {

        console.error("SubCategory Fetch Error:", error);
        res.status(500).json({ message: "Server Error" });

    }

});


/* ======================================================
   ✅ GET SUBJECTS (Category + SubCategory Wise)
====================================================== */
router.get("/subjects", async (req, res) => {
   try {

      const { category, subCategory } = req.query;

      const categoryData = await Category.findById(category);

      if (!categoryData) {
         return res.json([]);
      }

      // Find matching subcategory object
      const sub = categoryData.subCategories.find(s =>
         typeof s === "object"
            ? s.name === subCategory
            : s === subCategory
      );

      if (!sub) {
         return res.json([]);
      }

      // If sub is object → return its subjects
      if (typeof sub === "object" && sub.subjects) {
         return res.json(sub.subjects);
      }

      // If subcategories are just strings (no subjects stored)
      return res.json([]);

   } catch (err) {
      console.error("Subjects fetch error:", err);
      res.status(500).json([]);
   }
});



/* ======================================================
   ✅ GET QUESTION COUNT (For Dashboard Analytics)
====================================================== */

router.get("/count", async (req, res) => {

    try {
        

        const { category, subCategory, subject } = req.query;

        const filter = {};

        if (category && mongoose.Types.ObjectId.isValid(category)) {
            filter.category = new mongoose.Types.ObjectId(category);
        }

        if (subCategory) filter.subCategory = subCategory;
        if (subject) filter.subject = subject;

        const count = await Question.countDocuments(filter);

        res.json({ totalQuestions: count });

    } catch (error) {

        console.error("Question Count Error:", error);
        res.status(500).json({ message: "Server Error" });

    }

});


module.exports = router;
