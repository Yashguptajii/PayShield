import jwt from "jsonwebtoken";
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization token required"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET,
            {
                issuer: "payshield-auth"
            }
        );
        if (!decoded.sub) {
            return res.status(401).json({
                message: "Invalid token: user identity missing"
            });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
};