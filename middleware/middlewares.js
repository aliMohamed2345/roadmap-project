import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
export const isAdmin = (req, res, next) => {
    try {
        if (!req.user?.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized:You are not an admin" })
        next()
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies?.token;
        //check if the token exist
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized: no token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // attaches decoded token data 
        next();
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return res
            .status(401)
            .json({ success: false, message: `Invalid or expired token:${error.message}` });
    }
};

export const isIdValid = (req, res, next) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid Id' });
    next()
}
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Example endpoint that requires an API key
 *     description: This endpoint requires a valid API key as a query parameter.
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized: missing or invalid API key
 */
export const checkApiKey = (req, res, next) => {
    try {
        // Get API key from custom header 'x-api-key'
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No API key provided. Please send x-api-key header."
            });
        }

        if (apiKey !== process.env.API_KEY) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid API key"
            });
        }

        next();

    } catch (error) {
        console.error("API key middleware error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error while validating API key"
        });
    }
};

// Memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
};

export const upload = multer({ storage, fileFilter });
