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

export const checkApiKey = (req, res, next) => {
    try {
        const { key } = req.query;
        if (!key) return res.status(401).json({ success: false, message: "Unauthorized: no api key provided" });
        if (key !== process.env.API_KEY) return res.status(401).json({ success: false, message: "Unauthorized: invalid api key" });
        next();

    } catch (error) {
        console.error("Api key error:", error.message);
        return res
            .status(401)
            .json({ success: false, message: `Invalid or api key:${error.message}` });
    }
}

// Memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
};

export const upload = multer({ storage, fileFilter });
