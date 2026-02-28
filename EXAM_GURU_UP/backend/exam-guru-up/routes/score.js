const express = require("express");
const Score = require("../models/Score");
const User = require("../models/User");
 const { verifyToken } = require("../middleware/authMiddleware");
const Question = require("../models/Question");

const router = express.Router();

// ✅ Save Score
router.post("/submit", verifyToken, async (req, res) => {

   try {

      const { answers, quizType } = req.body;

      let score = 0;
      let detailedAnswers = [];

      for (let ans of answers) {

         const question = await Question.findById(ans.questionId);

         if (!question) continue;

         const isCorrect =
            ans.selectedAnswer === question.correctAnswer;

         if (isCorrect) {

            const level = (question.difficulty || "").toLowerCase();

            if (level === "hard") score += 3;
            else if (level === "medium") score += 2;
            else score += 1;
         }

         detailedAnswers.push({
            question: question.question,
            options: question.options,
            selectedAnswer: ans.selectedAnswer,
            correctAnswer: question.correctAnswer,
            difficulty: question.difficulty
         });
      }

      await Score.create({
         userId: req.user.id, score,
         total: detailedAnswers.length,
         examType: quizType || "General",
         subject: req.body.subject || "General"
        });


      res.json({
         success: true,
         score,
         total: detailedAnswers.length,
         answers: detailedAnswers   // 🔥 THIS FIXES YOUR ISSUE
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error" });
   }
});


// 🏆 Leaderboard
router.get("/leaderboard", verifyToken, async (req, res) => {
    try {

        const { examType, subject } = req.query;
        const userId = req.user.id;

        let filter = {};

        if (examType) {
            filter.examType = examType;
        }

        if (subject) {
            filter.subject = subject;
        }

        const groupedScores = await Score.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$userId",
                    maxScore: { $max: "$score" }
                }
            },
            { $sort: { maxScore: -1 } }
        ]);

        const totalUsers = groupedScores.length;

        const top10 = await Promise.all(
            groupedScores.slice(0, 10).map(async (entry, index) => {

                const user = await User.findById(entry._id).select("name");

                return {
                    rank: index + 1,
                    name: user?.name || "Unknown",
                    score: entry.maxScore
                };
            })
        );

        const userIndex = groupedScores.findIndex(
            s => s._id.toString() === userId.toString()
        );

        const userRank = userIndex + 1;

        let percentile = 0;
        if (userRank > 0 && totalUsers > 0) {
            percentile = (((totalUsers - userRank) / totalUsers) * 100).toFixed(2);
        }

        res.json({
            top10,
            userRank,
            totalUsers,
            percentile
        });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// 📊 Latest Score (Dashboard)
router.get("/latest", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id;

        const latestScore = await Score.findOne({ userId })
            .sort({ createdAt: -1 });

        if (!latestScore) {
            return res.json({ score: 0, total: 0 });
        }

        res.json({
            score: latestScore.score,
            total: latestScore.total
        });

    } catch (error) {
        console.error("Latest Score Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
