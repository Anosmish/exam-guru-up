require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

/* ================= APP CREATE FIRST ================= */

const app = express();
const server = http.createServer(app);

/* ================= CORS CONFIG ================= */

const allowedOrigins = [
  "https://prepzenith.netlify.app",
  "https://prepzenith-platform-web.vercel.app",
  "https://exam-guru-up.onrender.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5500",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Allow ALL Vercel preview deployments for this project
    if (origin.match(/^https:\/\/prepzenith-platform.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    // Allow specific listed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight OPTIONS requests for all routes
app.options("/(.*)", cors());

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cookieParser());

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.match(/^https:\/\/prepzenith-platform.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  }
});

/* ================= HEALTH CHECK ================= */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ================= ROUTES ================= */

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/admin",      require("./routes/admin"));
app.use("/api/quiz",       require("./routes/quiz"));
app.use("/api/score",      require("./routes/score"));
app.use("/api/user",       require("./routes/user"));
app.use("/api/student",    require("./routes/student"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/dashboard",  require("./routes/dashboard"));

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error:", err));

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);

  // Keep-alive ping every 14 minutes to prevent Render free tier sleep
  setInterval(() => {
    fetch(`https://exam-guru-up.onrender.com/api/health`)
      .then(() => console.log("Keep-alive ping sent ✅"))
      .catch(() => console.log("Keep-alive ping failed (server may be waking up)"));
  }, 14 * 60 * 1000);
});
