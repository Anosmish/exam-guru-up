const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

const User = require("../models/User");
const Dashboard = require("../models/Dashboard");
const TempUser = require("../models/TempUser");

const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/* ================= BREVO EMAIL CONFIG ================= */

const sendBrevoEmail = async (to, subject, htmlContent, textContent = "") => {
    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Exam Guru UP",
                    email: process.env.EMAIL_USER
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent,
                textContent: textContent || htmlContent.replace(/<[^>]*>/g, '')
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Brevo email sent successfully");
        return response.data;
    } catch (error) {
        console.error("Brevo email error:", error.response?.data || error.message);
        throw error;
    }
};

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
        
        console.log("Sending email via Brevo...");

        const htmlContent = `
            <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
                <div style="max-width:500px;margin:auto;background:#ffffff;padding:25px;border-radius:8px;">
                    <h2 style="color:#1e3a8a;margin-top:0;">Exam Guru UP</h2>
                    <p>Hello <b>${name}</b>,</p>
                    <p>Thank you for registering at Exam Guru UP.</p>
                    <p>Please verify your email address to activate your account.</p>
                    <p style="text-align:center;margin:30px 0;">
                        <a href="${verifyLink}" style="background:#2563eb;color:white;padding:12px 25px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                            Verify Email
                        </a>
                    </p>
                    <p style="font-size:12px;color:#777;margin-top:25px;">
                        If you did not create this account, you can safely ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                    <p style="font-size:11px;color:#999;text-align:center;margin:0;">
                        © ${new Date().getFullYear()} Exam Guru UP. All rights reserved.
                    </p>
                </div>
            </div>
        `;

        const textContent = `
Hello ${name},

Thank you for registering at Exam Guru UP.

To activate your account, please verify your email by clicking the link below:

${verifyLink}

If you did not create this account, please ignore this message.

Regards,
Exam Guru UP Team
        `;

        await sendBrevoEmail(email, "Verify your Exam Guru UP account", htmlContent, textContent);

        console.log("Email sent successfully via Brevo");
        res.json({ message: "Verification email sent. Please check your inbox." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed" });
    }
});

/* =================================================
   🔹 RESEND VERIFICATION EMAIL
================================================= */

router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        const tempUser = await TempUser.findOne({ email });

        if (!tempUser) {
            return res.status(404).json({ message: "No pending verification found." });
        }

        // Generate new token
        const newToken = crypto.randomBytes(32).toString("hex");
        tempUser.verificationToken = newToken;
        tempUser.expiresAt = Date.now() + 10 * 60 * 1000;
        await tempUser.save();

        const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify/${newToken}`;

        const htmlContent = `
            <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
                <div style="max-width:500px;margin:auto;background:#ffffff;padding:25px;border-radius:8px;">
                    <h2 style="color:#1e3a8a;margin-top:0;">Exam Guru UP</h2>
                    <p>Hello <b>${tempUser.name}</b>,</p>
                    <p>Here is your new verification link for Exam Guru UP:</p>
                    <p style="text-align:center;margin:30px 0;">
                        <a href="${verifyLink}" style="background:#2563eb;color:white;padding:12px 25px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                            Verify Email
                        </a>
                    </p>
                    <p style="font-size:12px;color:#777;">
                        This link will expire in 10 minutes.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                    <p style="font-size:11px;color:#999;text-align:center;margin:0;">
                        © ${new Date().getFullYear()} Exam Guru UP
                    </p>
                </div>
            </div>
        `;

        const textContent = `
Hello ${tempUser.name},

Here is your new verification link for Exam Guru UP:

${verifyLink}

This link will expire in 10 minutes.

If you did not request this, please ignore this email.

Regards,
Exam Guru UP Team
        `;

        await sendBrevoEmail(email, "Resend Verification - Exam Guru UP", htmlContent, textContent);

        res.json({ message: "Verification email resent." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error resending email" });
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
   🔹 LOGIN
================================================= */

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })
            .populate({
                path: "category",
                model: "Category",
                populate: {
                    path: "dashboard",
                    model: "Dashboard"
                }
            });

        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user });

    } catch (err) {
        console.error("Login Error:", err); // <-- exact error console
        res.status(500).json({ message: "Login failed", error: err.message });
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
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset.html?token=${resetToken}`;

        const htmlContent = `
            <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
                <div style="max-width:500px;margin:auto;background:#ffffff;padding:25px;border-radius:8px;">
                    <h2 style="color:#1e3a8a;margin-top:0;">Exam Guru UP</h2>
                    <p>Hello <b>${user.name}</b>,</p>
                    <p>You requested to reset your password for Exam Guru UP.</p>
                    <p style="text-align:center;margin:30px 0;">
                        <a href="${resetLink}" style="background:#dc2626;color:white;padding:12px 25px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="font-size:12px;color:#777;">
                        This link expires in 1 hour.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                    <p style="font-size:11px;color:#999;text-align:center;margin:0;">
                        © ${new Date().getFullYear()} Exam Guru UP
                    </p>
                </div>
            </div>
        `;

        const textContent = `
Hello ${user.name},

You requested to reset your password for Exam Guru UP.

Click the link below to reset your password:

${resetLink}

This link expires in 1 hour.

If you did not request this, please ignore this email.

Regards,
Exam Guru UP Team
        `;

        await sendBrevoEmail(user.email, "Reset Password - Exam Guru UP", htmlContent, textContent);

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
