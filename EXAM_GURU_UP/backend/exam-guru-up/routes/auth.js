const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const TempUser = require("../models/TempUser");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

/* =================================================
   🛡 RATE LIMIT PROTECTION
================================================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many requests. Try again later." }
});

/* =================================================
   📧 PROFESSIONAL EMAIL TEMPLATE
================================================= */

const generateEmailTemplate = (title, contentButton, buttonText, footerNote = "") => {
  return `
  <div style="background:#f4f6f9;padding:40px;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;">
      
      <div style="background:#1e3a8a;padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;">Exam Guru UP</h1>
        <p style="margin:5px 0 0 0;font-size:14px;">Empowering Your Success</p>
      </div>

      <div style="padding:30px;">
        <h2 style="color:#111827;">${title}</h2>
        <p style="color:#374151;font-size:15px;">
          ${contentButton}
        </p>

        <div style="text-align:center;margin:30px 0;">
          <a href="${contentButton}"
             style="background:#2563eb;color:white;padding:12px 25px;
             border-radius:6px;text-decoration:none;font-weight:bold;">
             ${buttonText}
          </a>
        </div>

        <p style="font-size:13px;color:#6b7280;">
          If you did not request this action, please ignore this email.
        </p>

        ${footerNote}
      </div>

      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#9ca3af;">
        © ${new Date().getFullYear()} Exam Guru UP. All rights reserved.
      </div>

    </div>
  </div>
  `;
};

/* =================================================
   📧 SEND EMAIL (Brevo API)
================================================= */

const sendEmail = async (to, subject, htmlContent) => {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Exam Guru UP",
        email: process.env.EMAIL_USER
      },
      to: [{ email: to }],
      subject,
      htmlContent
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );
};

/* =================================================
   🔹 REGISTER
================================================= */

router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, dob, email, password, category, subCategory } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    await TempUser.deleteOne({ email });

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
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;

    await sendEmail(
      email,
      "Verify Your Exam Guru UP Account",
      generateEmailTemplate(
        "Verify Your Email",
        verifyLink,
        "Verify Email"
      )
    );

    res.json({ message: "Verification email sent." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* =================================================
   🔄 RESEND VERIFICATION
================================================= */

router.post("/resend-verification", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser)
      return res.status(404).json({ message: "No pending verification found." });

    const newToken = crypto.randomBytes(32).toString("hex");
    tempUser.verificationToken = newToken;
    tempUser.expiresAt = Date.now() + 10 * 60 * 1000;
    await tempUser.save();

    const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify/${newToken}`;

    await sendEmail(
      email,
      "Resend Verification - Exam Guru UP",
      generateEmailTemplate(
        "Verify Your Email",
        verifyLink,
        "Verify Email"
      )
    );

    res.json({ message: "Verification email resent." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resending email" });
  }
});

/* =================================================
   🔹 VERIFY
================================================= */

router.get("/verify/:token", async (req, res) => {
  try {
    const tempUser = await TempUser.findOne({
      verificationToken: req.params.token,
      expiresAt: { $gt: Date.now() }
    });

    if (!tempUser)
      return res.send("Verification link expired.");

    const newUser = await User.create({
      ...tempUser.toObject(),
      role: "user"
    });

    await TempUser.deleteOne({ _id: tempUser._id });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/login-success.html?token=${token}`);

  } catch (err) {
    res.send("Verification failed.");
  }
});

/* =================================================
   🔹 LOGIN
================================================= */

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/* =================================================
   🔹 FORGOT PASSWORD
================================================= */

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset.html?token=${resetToken}`;

    await sendEmail(
      email,
      "Reset Password - Exam Guru UP",
      generateEmailTemplate(
        "Reset Your Password",
        resetLink,
        "Reset Password"
      )
    );

    res.json({ message: "Reset link sent." });

  } catch (err) {
    res.status(500).json({ message: "Error sending reset email" });
  }
});

/* ================================================= */

module.exports = router;
