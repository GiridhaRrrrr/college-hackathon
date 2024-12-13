const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]; // JWT is typically sent in the Authorization header
    // console.log(authHeader);
    const token = authHeader && authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"
    // console.log('token:',token);
    if (!token) {
        return res.status(401).json({ isSuccess: false, message: "Token not provided" });
    }

    // Verify the token
    jwt.verify(token,"123hi", (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.status(403).json({ isSuccess: false, message: "Token is invalid or expired" });
        }
        // console.log('user:',user)
        req.user = user; // Attach the decoded token payload (e.g., user ID) to the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateToken;
