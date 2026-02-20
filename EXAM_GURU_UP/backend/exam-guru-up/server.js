const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const categoryRoutes = require("./routes/category");




/* ================= APP SETUP ================= */

const app = express();
const server = http.createServer(app);

/* ================= SOCKET.IO SETUP ================= */

const io = new Server(server, {
    cors: {
        origin: "*",   // production me specific domain lagana
        methods: ["GET", "POST"]
    }
});

let onlineUsers = 0;

io.on("connection", (socket) => {

    onlineUsers++;
    

    // Send updated count to all clients
    io.emit("liveUsers", onlineUsers);

    socket.on("disconnect", () => {
        onlineUsers--;
        

        io.emit("liveUsers", onlineUsers);
    });

});

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= ROUTES ================= */

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const quizRoutes = require("./routes/quiz");
const scoreRoutes = require("./routes/score");
const userRoutes = require("./routes/user");
const studentRoutes = require("./routes/student");
app.use("/api/student", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/user", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/uploads", express.static("uploads"));
/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("Mongo Error:", err));

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});
