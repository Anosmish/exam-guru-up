const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

/* ================= GET ALL ================= */
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().populate("dashboard");;
        res.json(categories);
    } catch (err) {
        console.log("GET Category Error:", err);
        res.status(500).json({ message: "Error loading categories" });
    }
});


/* ================= ADD CATEGORY ================= */
router.post("/add", async (req, res) => {
    try {
        const { name, dashboardId  } = req.body;

        const exists = await Category.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = new Category({ name, dashboard: dashboardId, subCategories: [] });
        await category.save();

        res.json({ message: "Category added successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

/* ================= ADD SUB CATEGORY ================= */
router.post("/add-sub", async (req, res) => {

    const { categoryId, subCategory } = req.body;

    await Category.findByIdAndUpdate(
        categoryId,
        {
            $push: {
                subCategories: {
                    name: subCategory,
                    subjects: []
                }
            }
        }
    );

    res.json({ message: "SubCategory Added" });
});


router.post("/add-subject", async (req, res) => {

    const { categoryId, subCategory, subject } = req.body;

    await Category.updateOne(
        { _id: categoryId, "subCategories.name": subCategory },
        {
            $push: {
                "subCategories.$.subjects": subject
            }
        }
    );

    res.json({ message: "Subject Added" });
});


/* ================= GET SUBJECTS ================= */
router.get("/subjects", async (req, res) => {

    try {

        const { categoryId, subCategory } = req.query;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.json([]);
        }

        const sub = category.subCategories.find(
            s => s.name === subCategory
        );

        if (!sub) {
            return res.json([]);
        }

        res.json(sub.subjects || []);

    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});



/* ================= DELETE CATEGORY ================= */
router.delete("/:id", async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
});

/* ================= DELETE SUB CATEGORY ================= */
router.post("/delete-sub", async (req, res) => {

    try {

        const { categoryId, subCategory } = req.body;

        await Category.findByIdAndUpdate(
            categoryId,
            {
                $pull: {
                    subCategories: { name: subCategory }
                }
            }
        );

        res.json({ message: "SubCategory Deleted" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error deleting subcategory" });
    }

});

router.post("/delete-subject", async (req, res) => {

    try {

        const { categoryId, subCategory, subject } = req.body;

        await Category.updateOne(
            {
                _id: categoryId,
                "subCategories.name": subCategory
            },
            {
                $pull: {
                    "subCategories.$.subjects": subject
                }
            }
        );

        res.json({ message: "Subject Deleted" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error deleting subject" });
    }

});


module.exports = router;
