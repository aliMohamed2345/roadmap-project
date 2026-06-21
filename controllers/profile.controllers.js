import cloudinary from "../lib/cloudinary.js";
import { validateChangeProfileCredentials } from "../utils/validateUserCredentials.js"
import User from "../models/user.model.js";
import updateLoginStreak from "../utils/updateUserLoginStreak.js";
import checkAndGrantAchievements from "../utils/checkAndGrantAchievements.js";

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
        });
        if (!user) return res.status(404).json({ success: false, message: "User profile not found" })

        //streak check
        const streakChanged = updateLoginStreak(user)
        let newAchievements = [];

        if (streakChanged) {
            await user.save()
            newAchievements = await checkAndGrantAchievements(user, "streak_update");
        }

        return res.status(200).json({
            success: true,
            user,
            streak: {
                current: user.streakData.currentStreak,
                longest: user.streakData.longestStreak
            },
            ...(newAchievements.length > 0 && {
                newAchievements: newAchievements.map(a => ({
                    title: a.title,
                    description: a.description,
                    image: a.image
                }))
            })
        });

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

        return res.status(200).json({ success: true, success: `Image uploaded successfully`, imageURL: uploadResult.secure_url });
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
export const deleteProfile = async (req, res) => {
    try {
        const { id: userId } = req.user
        await User.findByAndDelete(userId)
        return res.status(200).json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}