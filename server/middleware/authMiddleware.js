import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../config/cookieOptions.js";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies[AUTH_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication",
    });
  }
};

export default authMiddleware;