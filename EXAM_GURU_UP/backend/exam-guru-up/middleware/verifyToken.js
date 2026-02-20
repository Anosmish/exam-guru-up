const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {

    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1]; // 👈 remove "Bearer "

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid Token"
        });
    }
};
