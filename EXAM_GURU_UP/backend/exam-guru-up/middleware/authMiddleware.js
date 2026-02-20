const jwt = require("jsonwebtoken");

/* ================= VERIFY TOKEN ================= */
const verifyToken = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        // Check header exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Extract actual token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data to request
        req.user = decoded;  // { id, role }

        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};


/* ================= ADMIN CHECK ================= */
const isAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    

    next();
};

module.exports = { verifyToken, isAdmin };
