// controllers/achievements.controller.js

import Achievements from '../models/achievement.model.js';
import cloudinary from "../lib/cloudinary.js";
import { validateAchievementData, validateUpdateAchievementData } from '../utils/validateAchievementData.js';
import Achievement from '../models/achievement.model.js';

/**
 * @swagger
 * /achievements:
 *   get:
 *     summary: Get all achievements
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all achievements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 achievements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Achievement'
 *       404:
 *         description: No achievements found
 *       500:
 *         description: Internal server error
 */
export const getAllAchievements = async (req, res) => {
    try {
        const achievements = await Achievements.find({}).sort({ createdAt: -1 });

        if (achievements.length === 0)
            return res.status(404).json({ success: false, message: "No achievements found" });

        return res.status(200).json({ success: true, achievements, total_achievements: achievements.length });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements/{id}:
 *   get:
 *     summary: Get a single achievement by ID
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Achievement found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 achievement:
 *                   $ref: '#/components/schemas/Achievement'
 *       404:
 *         description: Achievement not found
 *       500:
 *         description: Internal server error
 */
export const getAchievementById = async (req, res) => {
    try {
        const { id: achievementId } = req.params;

        const achievement = await Achievements.findById(achievementId);

        if (!achievement)
            return res.status(404).json({ success: false, message: "No achievement found" });

        return res.status(200).json({ success: true, achievement });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements:
 *   post:
 *     summary: Create a new achievement
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: "First Steps"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Complete your first roadmap"
 *     responses:
 *       201:
 *         description: Achievement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 achievement:
 *                   $ref: '#/components/schemas/Achievement'
 *       400:
 *         description: Validation error or duplicate title
 *       500:
 *         description: Internal server error
 */
export const createAchievement = async (req, res) => {
    try {
        const { title, description } = req.body;

        const { isValid, message } = validateAchievementData(title, description);
        if (!isValid) return res.status(400).json({ success: false, message });

        const existedAchievement = await Achievements.findOne({ title });
        if (existedAchievement)
            return res.status(400).json({ success: false, message: "An achievement with the same title already exists" });

        const createdAchievement = await Achievements.create({ title, description });
        return res.status(201).json({ success: true, message: "Achievement created successfully", achievement: createdAchievement });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements/{id}:
 *   put:
 *     summary: Update an achievement by ID
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: "Updated Title"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Updated description text here"
 *     responses:
 *       200:
 *         description: Achievement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 achievement:
 *                   $ref: '#/components/schemas/Achievement'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Achievement not found
 *       500:
 *         description: Internal server error
 */
export const updateAchievementById = async (req, res) => {
    try {
        const { id: achievementId } = req.params;
        const { title, description } = req.body;

        const { isValid, message } = validateUpdateAchievementData(title, description);
        if (!isValid) return res.status(400).json({ success: false, message });

        // Build update object with only provided fields
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;

        const achievement = await Achievements.findByIdAndUpdate(
            achievementId,
            updateFields,
            { new: true }
        );

        if (!achievement)
            return res.status(404).json({ success: false, message: "No achievement found" });

        return res.status(200).json({ success: true, message: "Achievement updated successfully", achievement });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements/{id}:
 *   delete:
 *     summary: Delete an achievement by ID
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Achievement deleted successfully
 *       404:
 *         description: Achievement not found
 *       500:
 *         description: Internal server error
 */
export const deleteAchievementById = async (req, res) => {
    try {
        const { id: achievementId } = req.params;

        const achievement = await Achievements.findById(achievementId);

        if (!achievement)
            return res.status(404).json({ success: false, message: "No achievement found" });

        //If it has an image, delete it from Cloudinary first
        if (achievement.image) {
            const publicId = achievement.image
                .split("/")
                .slice(-2)
                .join("/")
                .split(".")[0];

            await new Promise((resolve, reject) => {
                cloudinary.uploader.destroy(publicId, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            });
        }

        await Achievements.findByIdAndDelete(achievementId);

        return res.status(200).json({ success: true, message: "Achievement deleted successfully", achievement });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements/{id}/upload-image:
 *   put:
 *     summary: Upload a badge image for an achievement
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement MongoDB ObjectId
 *     requestBody:
 *       required: true
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imageURL:
 *                   type: string
 *                   example: "https://res.cloudinary.com/..."
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Achievement not found
 *       500:
 *         description: Internal server error
 */
export const uploadAchievementImage = async (req, res) => {
    try {
        const { id: achievementId } = req.params;

        if (!req.file)
            return res.status(400).json({ success: false, message: "No file uploaded" });

        const achievement = await Achievements.findById(achievementId);
        if (!achievement)
            return res.status(404).json({ success: false, message: "No achievement found" });

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "badges" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        achievement.image = uploadResult.secure_url;
        await achievement.save();

        return res.status(200).json({ success: true, imageURL: uploadResult.secure_url });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievements/{id}/delete-image:
 *   delete:
 *     summary: Delete the badge image of an achievement
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Badge image deleted successfully
 *       404:
 *         description: Achievement or image not found
 *       500:
 *         description: Internal server error
 */
export const deleteAchievementImage = async (req, res) => {
    try {
        const { id: achievementId } = req.params;

        const achievement = await Achievements.findById(achievementId);

        if (!achievement || !achievement.image)
            return res.status(404).json({ success: false, message: "No badge image found" });

        const publicId = achievement.image
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];

        await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        achievement.image = "";
        await achievement.save();

        return res.status(200).json({ success: true, message: "Badge image deleted successfully" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /achievement/bulk:
 *   post:
 *     summary: Create multiple achievements at once
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - achievements
 *             properties:
 *               achievements:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: First Login
 *                     description:
 *                       type: string
 *                       example: Log in to the platform for the first time
 *           example:
 *             achievements:
 *               - title: First Login
 *                 description: Log in to the platform for the first time
 *               - title: Quiz Master
 *                 description: Complete 100 quizzes
 *     responses:
 *       201:
 *         description: Achievements created successfully
 *       400:
 *         description: Validation error, duplicate titles, or existing achievements
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
export const createMultipleAchievement = async (req, res) => {
    try {
        const { achievements } = req.body;

        if (
            !achievements ||
            !Array.isArray(achievements) ||
            achievements.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "The achievements must be an array and contain at least one element"
            });
        }

        for (let i = 0; i++; i < achievements.length) {
            const currentAchievement = achievements[i];
            const { title, description } = currentAchievement;

            const { isValid, message } = validateAchievementData(
                title,
                description
            );

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Problem in achievement (${i + 1}): ${message}`
                });
            }
        }

        // Check duplicate titles inside request
        const titles = achievements.map(a => a.title.trim());

        const uniqueTitles = new Set(titles);

        if (uniqueTitles.size !== titles.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate achievement titles found in the request"
            });
        }

        const existingAchievements = await Achievement.find({
            title: { $in: titles }
        }).select("title");

        if (existingAchievements.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following achievements already exist: ${existingAchievements
                    .map(a => a.title)
                    .join(", ")}`
            });
        }

        const newAchievements = await Achievement.insertMany(achievements);

        return res.status(201).json({
            success: true,
            message: `${newAchievements.length} achievements added successfully`,
            achievements: newAchievements,
            number: newAchievements.length
        });

    }
    catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}