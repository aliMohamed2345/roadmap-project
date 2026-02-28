import Roadmap from './../models/roadmap.model.js'
import Section from '../models/section.model.js'
import Resource from '../models/resource.model.js'
import User from '../models/user.model.js'
import { validateRoadmapData } from '../utils/validateRoadmapData.js'
import PDFDocument from 'pdfkit'
import { Parser } from 'json2csv'

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
        const { title, description } = req.body

        const { isValid, message } = validateRoadmapData(title, description)
        if (!isValid) return res.status(400).json({ success: false, message })

        const roadmap = await Roadmap.create({ title, description })

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

        const { title, description } = req.body;

        const { isValid, message } = validateRoadmapData(title, description)
        if (!isValid) return res.status(400).json({ success: false, message })

        const roadmap = await Roadmap.findByIdAndUpdate(id, { title, description }, { new: true });

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
            populate: { path: "resources" }
        });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: "A4"
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${roadmap.title}.pdf"`
        );

        doc.pipe(res);

        doc
            .fontSize(26)
            .fillColor("#2C3E50")
            .text(roadmap.title, { align: "center" });

        doc.moveDown(0.5);

        doc
            .fontSize(14)
            .fillColor("#555")
            .text(roadmap.description, {
                align: "center"
            });

        doc.moveDown(2);

        doc
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .strokeColor("#cccccc")
            .stroke();

        doc.moveDown(1.5);

        roadmap.sections.forEach((section, index) => {

            doc
                .fontSize(18)
                .fillColor("#1A73E8")
                .text(`${index + 1}. ${section.title}`);

            doc.moveDown(0.3);

            doc
                .fontSize(10)
                .fillColor("#ffffff")
                .rect(doc.x, doc.y, 80, 18)
                .fill("#6C63FF")
                .fillColor("#ffffff")
                .text(section.difficulty || "N/A", doc.x + 10, doc.y + 5);

            doc.moveDown(1);

            doc
                .fontSize(12)
                .fillColor("#333")
                .text(section.description, {
                    align: "left"
                });

            doc.moveDown(1);

            if (section.resources.length > 0) {

                doc
                    .fontSize(14)
                    .fillColor("#000")
                    .text("Resources:", { underline: true });

                doc.moveDown(0.5);

                section.resources.forEach((resource, rIndex) => {

                    const linkText = `• ${resource.title} (${resource.type})`;

                    doc
                        .fillColor("#1A73E8")
                        .fontSize(12)
                        .text(linkText, {
                            link: resource.url,
                            underline: true
                        });

                    doc.moveDown(0.4);
                });

            }

            doc.moveDown(1.5);

            // Divider between sections
            doc
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .strokeColor("#eeeeee")
                .stroke();

            doc.moveDown(1.5);

        });


        doc.end();

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
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