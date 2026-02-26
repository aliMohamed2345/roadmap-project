import User from "../models/user.model.js"
import { validateChangeProfileCredentials } from "../utils/validateUserCredentials.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid API key
 */
export const Profile = async (req, res) => {

    try {
        const { id: userId } = req.user

        const user = await User.findById(userId).select('-password -__v').populate({
            path: 'progressData.quiz.quiz', // path to populate
            // select: 'title description questions' // pick only the fields you want
        });
        return res.status(200).json({ success: true, user })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               imageURL:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Invalid API key
 */
export const updateProfile = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { username, email, imageURL, bio } = req.body;

        const { isValid, message } = validateChangeProfileCredentials(email, username, imageURL, bio)
        if (!isValid) return res.status(400).json({ success: false, message })

        const updatedData = {};

        if (username) updatedData.username = username;
        if (email) updatedData.email = email;
        if (imageURL) updatedData.imageURL = imageURL;
        if (bio) updatedData.bio = bio;

        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select('username email imageURL id isAdmin');
        return res.status(200).json({ success: true, message: 'User updated successfully', user })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, password, confirmPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       403:
 *         description: Invalid API key
 */
export const changePassword = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { currentPassword, password, confirmPassword } = req.body;

        // Validate input presence
        if (!currentPassword || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password, new password, and confirm password are required.",
            });
        }

        //Match new password and confirmation
        if (password !== confirmPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Passwords do not match." });
        }

        //Validate new password strength
        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            });
        }

        //Check current password correctness
        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found." });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch)
            return res
                .status(401)
                .json({ success: false, message: "Current password is incorrect." });

        // Hash and update password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        return res
            .status(200)
            .json({ success: true, message: "Password changed successfully.", });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by email or username
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Invalid API key
 */
export const getAllUsers = async (req, res) => {
    try {
        const { q, page = 1, isAdmin } = req.query;

        const userPerPage = 10;
        const skip = (page - 1) * userPerPage;

        // Build dynamic query
        const queryData = {};

        if (isAdmin !== undefined) {
            queryData.isAdmin = (isAdmin) === "true"
        }
        if (q) {
            queryData.$or = [
                { email: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalUsers = await User.countDocuments(queryData);

        // Fetch users with pagination
        const users = await User.find(queryData)
            .select('-password -__v')
            .limit(userPerPage)
            .skip(skip)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            page: +page,
            totalUsers,
            totalPages: Math.ceil(totalUsers / userPerPage),
            users
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get specific user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Invalid API key
 */
export const getSpecificUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id).select('-password -__v')
        return res.status(200).json({ success: true, user })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Toggle user role
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Invalid API key
 */
export const toggleRole = async (req, res) => {
    try {
        const { id: userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        //toggle user role 
        user.isAdmin = !user.isAdmin;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User role updated successfully. ${user.username} is now ${user.isAdmin ? "an admin" : "a regular user"
                }.`,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/users:
 *   delete:
 *     summary: Delete logged-in user
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Invalid API key
 */
export const deleteUser = async (req, res) => {
    try {
        const { id: userId } = req.user
        await User.findByAndDelete(userId)
        return res.status(200).json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/users/upload-image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file uploaded
 *       403:
 *         description: Invalid API key
 */
export const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Wrap upload_stream in a Promise
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "user_profiles" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Save Cloudinary URL to user
        const user = await User.findById(req.user.id);
        user.imageURL = uploadResult.secure_url;
        await user.save();

        return res.status(200).json({ success: true, imageURL: uploadResult.secure_url });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/users/delete-image:
 *   post:
 *     summary: Delete profile image
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file uploaded
 *       403:
 *         description: Invalid API key
 */
export const deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !user.imageURL) {
            return res.status(404).json({
                success: false,
                message: "No profile image found",
            });
        }

        // Extract public_id from Cloudinary URL
        const imageUrl = user.imageURL;
        const publicId = imageUrl
            .split("/")
            .slice(-2) // folder + filename
            .join("/")
            .split(".")[0];

        // Wrap destroy in a Promise
        await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        // Remove from DB
        user.imageURL = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile image deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
