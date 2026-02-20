const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const TempUser = require("../models/TempUser");

const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");



/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000, // 10 sec
    greetingTimeout: 10000,
    socketTimeout: 10000
});
/* =================================================
   🔹 REGISTER STEP 1 (Save Temp + Send Email)
================================================= */

router.post("/register", async (req, res) => {
    try {
        

        const { name, dob, email, password, category, subCategory } = req.body;


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const existingTemp = await TempUser.findOne({ email });
        if (existingTemp) {
            await TempUser.deleteOne({ email });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        await TempUser.create({
            name,
            dob,
            email,
            password: hashedPassword,
            category,
            subCategory,
            verificationToken,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;
             console.log("Sending email...");
        await transporter.sendMail({
  from: `"Exam Guru UP" <${process.env.EMAIL_USER}>`,
  to: email,
  replyTo: process.env.EMAIL_USER,
  subject: "Verify your Exam Guru UP account",
  text: `
Hello ${name},

Thank you for registering at Exam Guru UP.

To activate your account, please verify your email by clicking the link below:

${verifyLink}

If you did not create this account, please ignore this message.

Regards,
Exam Guru UP Team
  `,
  html: `
  <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
    <div style="max-width:500px;margin:auto;background:#ffffff;padding:25px;border-radius:8px;">
      <h2>Exam Guru UP</h2>
      <p>Hello <b>${name}</b>,</p>
      <p>Thank you for registering.</p>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${verifyLink}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Verify Email

        </a>
      </p>
      <p style="font-size:12px;color:#777;">
        If you did not create this account, you can safely ignore this email.
      </p>
      <hr>
      <p style="font-size:11px;color:#999;text-align:center;">
        © ${new Date().getFullYear()} Exam Guru UP
      </p>
    </div>
  </div>
  `
});

console.log("Email sent successfully");

        res.json({ message: "Verification email sent. Please check your inbox." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed" });
    }
});

/* =================================================
   🔹 VERIFY EMAIL & ACTIVATE ACCOUNT
================================================= */

router.get("/verify/:token", async (req, res) => {

   const token = req.params.token;

   res.send(`
      <h2>Email Verification</h2>
      <p>Do you want to activate your account?</p>

      <form method="POST" action="/api/auth/verify/${token}">
         <button type="submit"
            style="padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:5px;">
            Yes, I want to Login
         </button>
      </form>
   `);
});


router.post("/verify/:token", async (req, res) => {
   try {

      const tempUser = await TempUser.findOne({
         verificationToken: req.params.token,
         expiresAt: { $gt: Date.now() }
      });

      if (!tempUser) {
         return res.send("Verification link expired or invalid.");
      }

      const newUser = await User.create({
         name: tempUser.name,
         dob: tempUser.dob,
         email: tempUser.email,
         password: tempUser.password,
         category: tempUser.category,
         subCategory: tempUser.subCategory,
         role: "user"
      });

      await TempUser.deleteOne({ _id: tempUser._id });

      const token = jwt.sign(
         { id: newUser._id, role: newUser.role },
         process.env.JWT_SECRET,
         { expiresIn: "7d" }
      );

      res.send(`
   <h2>Account Verified Successfully ✅</h2>
   <button onclick="window.location='${process.env.FRONTEND_URL}/login-success.html?token=${token}'"
      style="padding:10px 20px;background:#16a34a;color:white;border:none;border-radius:5px;">
      Login Now
   </button>
`);

   } catch (err) {
      console.error(err);
      res.send("Verification failed.");
   }
});


/* =================================================
   🔹 LOGIN (Only Verified Users Exist in DB)
================================================= */

router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email })
            .populate({
                path: "category",
                populate: {
                    path: "dashboard"
                }
            });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Login failed" });
    }
});

/* ================= GET LOGGED IN USER ================= */
router.get("/me", verifyToken, async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .populate({
                path: "category",
                populate: {
                    path: "dashboard"
                }
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});


/* =================================================
   🔹 FORGOT PASSWORD
================================================= */

router.post("/forgot-password", async (req, res) => {
    try {

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000;
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/frontend/reset.html?token=${resetToken}`;

        await transporter.sendMail({
            to: user.email,
            subject: "Reset Password - Exam Guru",
            html: `
                <h2>Password Reset</h2>
                <p>Click below to reset password:</p>
                <a href="${resetLink}"
                   style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
                   Reset Password
                </a>
                <p>This link expires in 1 hour.</p>
            `
        });

        res.json({ message: "Reset link sent to email" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error sending reset email" });
    }
});

/* =================================================
   🔹 RESET PASSWORD
================================================= */

router.post("/reset-password", async (req, res) => {
    try {

        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Reset failed" });
    }
});

module.exports = router;
