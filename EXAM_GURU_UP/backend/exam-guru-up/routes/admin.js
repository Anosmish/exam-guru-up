const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const Question = require("../models/Question");
const User = require("../models/User");
const Category = require("../models/Category");
const Note = require("../models/Note");
const Paper = require("../models/Paper");
const Project = require("../models/Project");
const Practical = require("../models/Practical");
/* ================= MULTER CONFIG ================= */

/* ================= MULTER CONFIG ================= */



const upload = multer({
  storage: multer.memoryStorage(),  // memory storage
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/* ================================================= */
/* =================================================
                QUESTION MANAGEMENT
================================================= */

// BULK JSON UPLOAD
router.post("/upload-json",
    verifyToken,
    isAdmin,
    upload.single("file"),
    async (req, res) => {
        try {
            const rawData = fs.readFileSync(req.file.path);
            const questions = JSON.parse(rawData);

            for (let q of questions) {
                if (!q.question || !q.options || !q.correctAnswer || !q.subject || !q.examType) continue;
                await Question.create(q);
            }

            fs.unlinkSync(req.file.path);

            res.json({ message: "Questions uploaded successfully" });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ADD QUESTION
router.post("/add-question", verifyToken, isAdmin, async (req, res) => {
    try {
        const question = new Question(req.body);
        await question.save();
        res.json({ message: "Question added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL QUESTIONS
router.get("/all-questions", verifyToken, isAdmin, async (req, res) => {
    const questions = await Question.find();
    res.json(questions);
});

// DELETE QUESTION
router.delete("/delete-question/:id", verifyToken, isAdmin, async (req, res) => {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted" });
});

/* =================================================
                CATEGORY MANAGEMENT
================================================= */

router.post("/add-subcategory", verifyToken, isAdmin, async (req, res) => {
    try {
        const { categoryId, subCategoryName } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });

        category.subCategories.push({
            name: subCategoryName,
            subjects: []
        });

        await category.save();
        res.json({ message: "SubCategory added successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

router.post("/add-subject", verifyToken, isAdmin, async (req, res) => {
    try {
        const { categoryId, subCategoryName, subject } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const sub = category.subCategories.find(s => s.name === subCategoryName);
        if (!sub) return res.status(404).json({ message: "SubCategory not found" });

        sub.subjects.push(subject);
        await category.save();

        res.json({ message: "Subject added successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

/* =================================================
                USER MANAGEMENT
================================================= */

// GET ALL USERS
router.get("/all-users", verifyToken, isAdmin, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// TOTAL USERS
router.get("/total-users", verifyToken, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        res.json({ success: true, totalUsers });
    } catch {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// DELETE USER
router.delete("/delete-user/:id", verifyToken, isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
});

/* =================================================
            STUDY MATERIAL CRUD SYSTEM
================================================= */

// UPLOAD CONTENT (Note / Paper / Project)
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

router.post(
  "/upload-content",
  verifyToken,
  isAdmin,
  upload.single("pdf"),
  
  async (req, res) => {
    try {

      const {
        contentType,
        subCategory,
        subject,
        semester,
        title,
        type
      } = req.body;

      if (req.file.mimetype !== "application/pdf") {
  return res.status(400).json({ message: "Only PDF files allowed" });
}

      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      // 🔥 Upload to Supabase
      const { error } = await supabase.storage
        .from("study-material")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // 🔥 Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("study-material")
        .getPublicUrl(fileName);

      const pdfUrl = publicUrlData.publicUrl;

      let saved;

      if (contentType === "note") {
        saved = await Note.create({
          subCategory,
          subject,
          semester,
          title,
          pdfUrl
        });
      }

      if (contentType === "paper") {
        saved = await Paper.create({
          subCategory,
          subject,
          semester,
          title,
          pdfUrl
        });
      }

      if (contentType === "project") {
        saved = await Project.create({
          subCategory,
          type,
          title,
          pdfUrl
        });
      }

      if (contentType === "practical") {
  saved = await Practical.create({
    subCategory,
    subject,
    semester,
    title,
    pdfUrl
  });
}

      res.json({ message: "Uploaded Successfully", data: saved });

    } catch (err) {
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  }
);

// LIST CONTENT
router.get("/list-content",
    verifyToken,
    isAdmin,
    async (req, res) => {

        const { type } = req.query;
        let data = [];
if (type === "note") data = await Note.find();
if (type === "paper") data = await Paper.find();
if (type === "project") data = await Project.find();
if (type === "practical") data = await Practical.find();
        res.json(data);
    }
);

// DELETE CONTENT + FILE
router.delete(
  "/delete-content/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {

    const { type } = req.query;

    let model;

if (type === "note") model = Note;
if (type === "paper") model = Paper;
if (type === "project") model = Project;
if (type === "practical") model = Practical;
    const item = await model.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not Found" });

    // Extract filename from URL
    const fileName = item.pdfUrl.split("/").pop();

    await supabase.storage
      .from("study-material")
      .remove([fileName]);

    await model.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted Successfully" });
  }
);

// GET ALL CATEGORIES
router.get("/all-categories", verifyToken, isAdmin, async (req,res)=>{
    const categories = await Category.find();
    res.json(categories);
});

module.exports = router;