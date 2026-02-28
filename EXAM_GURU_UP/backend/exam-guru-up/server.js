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
  "http://localhost:5500",
  "https://exam-guru-up.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));



app.use(express.json());

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ================= ROUTES ================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/score", require("./routes/score"));
app.use("/api/user", require("./routes/user"));
app.use("/api/student", require("./routes/student"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use(cookieParser());

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error:", err));

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
