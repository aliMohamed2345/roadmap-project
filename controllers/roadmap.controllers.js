import Roadmap from './../models/roadmap.model.js'
import Section from '../models/section.model.js'
import Resource from '../models/resource.model.js'
import User from '../models/user.model.js'
import { validateRoadmapData, validateUpdateRoadmapData } from '../utils/validateRoadmapData.js'
import PDFDocument from 'pdfkit'
import { Parser } from 'json2csv'
import {
    C,
    DIFFICULTY,
    LAYOUT,
    RESOURCE_TYPE,
    drawBackground,
    drawConnector,
    drawFooter,
    drawHeader,
    drawSectionCard,
    measureCardHeight,
    roundedRect
} from '../utils/PDFBuilder.js'
import cloudinary from '../lib/cloudinary.js'

/**
 * @swagger
 * /api/v1/roadmap:
 *   get:
 *     summary: Get all roadmaps
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roadmaps
 */
export const getAllRoadmapData = async (req, res) => {
    try {
        const roadmap = await Roadmap.find().select('-section')
        if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" })
        if (roadmap.length === 0) return res.status(200).json({ success: false, message: "No roadmap available. Please add a new one." })

        return res.status(200).json({ success: true, roadmap });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{id}/progress:
 *   get:
 *     summary: Get user progress for a roadmap
 *     tags: [Roadmaps]
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
 *     responses:
 *       200:
 *         description: Roadmap progress fetched
 */
export const getUserRoadmapProgress = async (req, res) => {
    try {
        const { id: userId } = req.user
        const { id: roadmapId } = req.params;

        // Fetch roadmap with sections and nested resources
        const roadmap = await Roadmap.findById(roadmapId).populate({
            path: "sections",
            populate: {
                path: "resources",
                model: "Resource",
            },
        });

        if (!roadmap) {
            return res
                .status(404)
                .json({ success: false, message: "Roadmap not found" });
        }

        // Fetch user
        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        // Get user's progress for this roadmap
        let progress = user.progressData.roadmap.find(
            (e) => e.roadmap.toString() === roadmapId
        );

        // If no progress, initialize
        if (!progress) {
            progress = {
                roadmap: roadmap._id,
                completedSections: [],
                numberOfAllSections: roadmap.sections.length,
            };
        }


        // Prepare detailed completed sections
        const completedSections = roadmap.sections.map((section) => ({
            _id: section._id,
            title: section.title,
            description: section.description,
            difficulty: section.difficulty,
            completed: progress.completedSections.some(
                (id) => id.toString() === section._id.toString()
            ),
            resources: section.resources.map((resource) => ({
                _id: resource._id,
                title: resource.title,
                url: resource.url,
                type: resource.type,
            })),
        }));

        // Calculate totals
        const total = roadmap.sections.length;
        const completed = completedSections.filter((s) => s.completed).length;
        const progressPercentage =
            total > 0 ? Math.round((completed / total) * 100) : 0;

        return res.status(200).json({
            success: true,
            roadmap: {
                _id: roadmap._id,
                title: roadmap.title,
                description: roadmap.description,
            },
            sections: completedSections,
            total,
            completed,
            progressPercentage,
        });
    } catch (error) {
        console.error("Get User Roadmap Progress Error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
};

/**
 * @swagger
 * /api/v1/roadmap/{id}:
 *   get:
 *     summary: Get specific roadmap
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key required
 *     responses:
 *       200:
 *         description: Roadmap fetched
 *       404:
 *         description: Roadmap not found
 */
export const getSpecificRoadmap = async (req, res) => {
    try {
        const { id } = req.params

        const roadmap = await Roadmap.findById(id).populate('sections', 'title');
        if (!roadmap) return res.status(400).json({ success: false, message: "Roadmap not found" })

        return res.status(200).json({ success: true, roadmap });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap:
 *   post:
 *     summary: Create roadmap
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Roadmap created
 */
export const createRoadmap = async (req, res) => {
    try {
        const { title, description, tags } = req.body

        const { isValid, message } = validateRoadmapData(title, description, tags)
        if (!isValid) return res.status(400).json({ success: false, message })

        const existedRoadmap = await Roadmap.findOne({ title });

        if (existedRoadmap) return res.status(400).json({ success: false, message: "An roadmap with the same title already exists" })

        const roadmap = await Roadmap.create({ title, description, tags })

        return res.status(201).json({ success: true, message: "Roadmap created successfully", roadmap });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{id}:
 *   put:
 *     summary: Update roadmap
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key required
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Roadmap updated
 */
export const updateRoadmap = async (req, res) => {
    try {
        const { id } = req.params

        const { title, description, tags } = req.body;

        const { isValid, message } = validateUpdateRoadmapData(title, description, tags)
        if (!isValid) return res.status(400).json({ success: false, message })

        const updatedData = {}

        if (title !== undefined) updatedData.title = title
        if (description !== undefined) updatedData.description = description
        if (tags !== undefined) updatedData.tags = tags

        const roadmap = await Roadmap.findByIdAndUpdate(id, updatedData, { new: true });

        if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" })

        return res.status(200).json({ success: true, message: "Roadmap updated successfully", roadmap });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{id}:
 *   delete:
 *     summary: Delete roadmap
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key required
 *     responses:
 *       200:
 *         description: Roadmap deleted
 */
export const deleteRoadmap = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the roadmap
        const roadmap = await Roadmap.findByIdAndDelete(id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        // Find all sections of this roadmap
        const sections = await Section.find({ roadmapId: id });

        // Extract section IDs
        const sectionIds = sections.map(sec => sec._id);

        // Delete all resources related to these sections
        const resources = await Resource.deleteMany({ sectionId: { $in: sectionIds } });

        //checking the existence of the resources
        if (!resources) return res.status(404).json({ success: false, message: "Resources not found" });

        // Delete all sections related to the roadmap
        const section = await Section.deleteMany({ roadmapId: id });

        //checking the existence of the sections
        if (!section) return res.status(404).json({ success: false, message: "Sections not found" });

        // Remove roadmap from all users' progress data
        await User.updateMany(
            {},
            { $pull: { "progressData.roadmap": id } }
        );

        return res.status(200).json({
            success: true,
            message: "Roadmap, related sections, and resources deleted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @swagger
 * /api/v1/roadmaps/{id}/export/json:
 *   get:
 *     summary: Export roadmap as JSON file
 *     tags: [Roadmap Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Roadmap ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roadmap exported successfully
 *       404:
 *         description: Roadmap not found
 *       500:
 *         description: Server error
 */
export const exportRoadmapToJSON = async (req, res) => {
    try {
        const { id: roadmapId } = req.params;

        const roadmap = await Roadmap.findById(roadmapId)
            .populate({
                path: "sections",
                populate: {
                    path: "resources"
                }
            });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        res.setHeader("Content-Disposition", "attachment; filename=roadmap.json");
        res.setHeader("Content-Type", "application/json");

        return res.status(200).json(roadmap);

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmaps/{id}/export/pdf:
 *   get:
 *     summary: Export roadmap as PDF file
 *     tags: [Roadmap Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Roadmap ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *       404:
 *         description: Roadmap not found
 *       500:
 *         description: Server error
 */
export const exportRoadmapToPDF = async (req, res) => {
    try {
        const { id: roadmapId } = req.params;

        const roadmap = await Roadmap.findById(roadmapId).populate({
            path: "sections",
            populate: { path: "resources" },
        });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        const doc = new PDFDocument({
            margin: 0,
            size: "A4",
            bufferPages: true,
            info: {
                Title: roadmap.title,
                Author: "MERN Roadmap Platform",
                Subject: "Roadmap Export",
            },
        })

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${roadmap.title}.pdf"`);
        doc.pipe(res);

        // ── Page layout constants ─────────────────────────────────────────────
        const CARD_X = 30;
        const CARD_W = 595 - 60;
        const CARD_GAP = 18;
        const START_Y = 148;    // first card top (below 130pt header + 18pt gap)
        const PAGE_MAX = 812;    // stop before footer zone

        let pageNum = 1;
        let cursorY = START_Y;
        const cardPositions = [];   // [(top, bottom)] for connector lines

        drawBackground(doc);
        drawHeader(doc, roadmap.title, roadmap.description || "");
        drawFooter(doc, roadmap.title, pageNum);

        for (let i = 0; i < roadmap.sections.length; i++) {
            const section = roadmap.sections[i];
            const cardH = measureCardHeight(doc, section, CARD_W);

            // Page break if card won't fit
            if (cursorY + cardH > PAGE_MAX) {
                doc.addPage({ margin: 0, size: "A4" });
                pageNum++;
                drawBackground(doc);
                drawHeader(doc, roadmap.title, roadmap.description || "");
                drawFooter(doc, roadmap.title, pageNum);
                cursorY = START_Y;
                cardPositions.length = 0;   // reset connectors for new page
            }

            const cardBottom = drawSectionCard(doc, section, i, CARD_X, cursorY, CARD_W);
            cardPositions.push([cursorY, cardBottom]);
            cursorY = cardBottom + CARD_GAP;
        }

        // Dashed connectors between cards
        const connectorX = CARD_X + 28;   // aligned with circle centre
        for (let i = 0; i < cardPositions.length - 1; i++) {
            const [, bot] = cardPositions[i];
            const [nextTop] = cardPositions[i + 1];
            drawConnector(doc, connectorX, bot, nextTop);
        }

        doc.end();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/roadmaps/{id}/export/csv:
 *   get:
 *     summary: Export roadmap as CSV file
 *     tags: [Roadmap Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Roadmap ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *       404:
 *         description: Roadmap not found
 *       500:
 *         description: Server error
 */
export const exportRoadmapToCSV = async (req, res) => {
    try {
        const { id: roadmapId } = req.params;

        const roadmap = await Roadmap.findById(roadmapId).populate({
            path: "sections",
            select: "title difficulty createdAt"
        });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        // Transform data for CSV export
        const csvData = roadmap.sections.map(section => ({
            sectionTitle: section.title,
            difficulty: section.difficulty || "N/A",
            createdAt: section.createdAt.toISOString()
        }));

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.header(
            "Content-Disposition",
            `attachment; filename="${roadmap.title}.csv"`
        );

        return res.status(200).send(csv);
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{roadmapId}/recommended:
 *   get:
 *     summary: Get recommended roadmap based on shared tags
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the roadmap to base recommendations on
 *     responses:
 *       200:
 *         description: List of recommended roadmaps retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendedRoadmaps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       level:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid roadmap ID format
 *       404:
 *         description: Roadmap not found or no related roadmaps exist
 *       500:
 *         description: Internal server error
 */
export const getRecommendedRoadmaps = async (req, res) => {
    try {
        const { id: roadmapId } = req.params

        const roadmap = await Roadmap.findById(roadmapId);

        //check if the roadmap with the given id exists
        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        const recommendedRoadmaps = await Roadmap.find(
            {
                tags: { $in: roadmap.tags },
                //make sure to not return the current roadmap id 
                _id: { $ne: roadmapId }
            }
        ).select("-__v")

        //checking if there are recommended roadmap
        if (!recommendedRoadmaps || recommendedRoadmaps.length === 0) {
            return res.status(404).json({ success: false, message: `No recommended roadmaps found!` })
        }

        return res.status(200).json({
            success: true,
            message: `Recommended roadmaps fetched successfully`,
            roadmapNumber: recommendedRoadmaps.length,
            recommendedRoadmaps
        })

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{id}/upload-image:
 *   put:
 *     summary: Upload or update a roadmap's cover image
 *     description: Uploads an image to Cloudinary and saves the URL on the roadmap. Requires admin privileges.
 *     tags: [Roadmaps]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the roadmap to upload an image for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 imageURL:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/v123/roadmap_images/abc123.png
 *       400:
 *         description: No file uploaded or invalid roadmap ID format
 *       401:
 *         description: Unauthorized - missing or invalid token / API key
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Roadmap not found
 *       500:
 *         description: Internal server error
 */
export const uploadRoadmapImage = async (req, res) => {
    try {
        const { id: roadmapId } = req.params
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Wrap upload_stream in a Promise
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "roadmap_images" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Save Cloudinary URL to user
        const roadmap = await Roadmap.findById(roadmapId);
        roadmap.image = uploadResult.secure_url;
        await roadmap.save();

        return res.status(200).json({ success: true, message: "Image uploaded successfully", imageURL: uploadResult.secure_url });
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/roadmap/{id}/remove-image:
 *   delete:
 *     summary: Remove a roadmap's cover image
 *     description: Deletes the roadmap's image from Cloudinary and clears the image field. Requires admin privileges.
 *     tags: [Roadmaps]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the roadmap to remove the image from
 *     responses:
 *       200:
 *         description: Roadmap image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: roadmap image deleted successfully
 *       400:
 *         description: Invalid roadmap ID format
 *       401:
 *         description: Unauthorized - missing or invalid token / API key
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Roadmap not found or no image exists
 *       500:
 *         description: Internal server error
 */
export const RemoveRoadmapImage = async (req, res) => {
    try {

        const { id: roadmapId } = req.params;

        const roadmap = await Roadmap.findById(roadmapId);

        if (!roadmap || !roadmap.image)
            return res.status(404).json({ success: false, message: "No badge image found" });

        const publicId = roadmap.image
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

        roadmap.image = "";
        await roadmap.save();

        return res.status(200).json({ success: true, message: "roadmap image deleted successfully" });


    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}