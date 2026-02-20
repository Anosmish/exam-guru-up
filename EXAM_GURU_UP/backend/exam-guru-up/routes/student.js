const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Paper = require("../models/Paper");
const Project = require("../models/Project");
const Category = require("../models/Category");

/* ===== GET SUBJECTS BY SUBCATEGORY ===== */
router.get("/subjects/:subCategoryName", async (req, res) => {

    const { subCategoryName } = req.params;

    const category = await Category.findOne({
        "subCategories.name": subCategoryName
    });

    if (!category) return res.json([]);

    const sub = category.subCategories.find(
        s => s.name === subCategoryName
    );

    res.json(sub.subjects);
});

/* ===== GET NOTES ===== */
router.get("/notes", async (req, res) => {

    const { subCategory, subject, semester, unit } = req.query;

    const filter = { subCategory, subject };

    if (semester) filter.semester = semester;
    if (unit) filter.unit = unit;

    const notes = await Note.find(filter);

    res.json(notes);
});

/* ===== GET PAPERS ===== */
router.get("/papers", async (req, res) => {

    const { subCategory, subject, semester } = req.query;

    const filter = { subCategory, subject };
    if (semester) filter.semester = semester;

    const papers = await Paper.find(filter);

    res.json(papers);
});

/* ===== GET PROJECTS ===== */
router.get("/projects", async (req, res) => {

    const { subCategory, type } = req.query;

    const projects = await Project.find({
        subCategory,
        type
    });

    res.json(projects);
});

module.exports = router;