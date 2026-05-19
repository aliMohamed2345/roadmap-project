import Project from "../models/project.model.js";
import {
    validateProjectData,
    validateProjectQueryString,
    validateProjectUpdateData,
} from "../utils/validateProjectData.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit"
import {
    PDF_SIZES,
    LEVEL_COLORS,
    PDF_FONTS,
    PDF_COLORS,
    drawRoundedRect
} from '../utils/PDFBuilder.js'
import mongoose from "mongoose";
/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects (with search & pagination)
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *         description: Filter by project level
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: List of projects
 *       404:
 *         description: No projects found
 */
export const getAllProjects = async (req, res) => {
    try {
        const { q = "", page = 1, limit = 10, level } = req.query;

        const { isValid, message } = validateProjectQueryString(q, +page, +limit, level);
        if (!isValid)
            return res.status(400).json({ success: false, message });

        const projectPerPage = +limit;
        const currentPage = +page;

        const filter = {
            $or: [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ],
        };
        if (level) {
            filter.level = { $regex: level, $options: "i" }
        }

        const [projects, totalDocuments] = await Promise.all([
            Project.find(filter)
                .skip((currentPage - 1) * projectPerPage)
                .limit(projectPerPage)
                .sort({ createdAt: -1 }).select('-__v'),
            Project.countDocuments(filter),
        ]);

        if (!projects.length)
            return res.status(404).json({
                success: false,
                message: "There's no project",
            });

        const totalPages = Math.ceil(totalDocuments / projectPerPage);

        return res.status(200).json({
            success: true,
            projects,
            projectNumber: totalDocuments,
            page: currentPage,
            limit: projectPerPage,
            totalPages,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [title, description, level]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 */
export const createProject = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { title, description, level, tags } = req.body

        const { isValid, message } = validateProjectData(title, description, level, tags);
        if (!isValid)
            return res.status(400).json({ success: false, message });

        const project = await Project.create({
            title,
            description,
            level,
            tags,
            userId,
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Get specific project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project fetched successfully
 *       404:
 *         description: Project not found
 */
export const getSpecificProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);

        if (!project)
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });

        return res.status(200).json({ success: true, project });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   put:
 *     summary: Update specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
export const updateSpecificProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const { title, description, level, tags } = req.body
        const { isValid, message } = validateProjectUpdateData(title, description, level, tags);
        if (!isValid)
            return res.status(400).json({ success: false, message });

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { title, description, level, tags },
            { new: true, runValidators: true }
        );

        if (!updatedProject)
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: updatedProject,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
export const deleteSpecificProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (!deletedProject)
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
            project: deletedProject
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/project/{projectId}/export/csv:
 *   get:
 *     summary: Export project and its steps as a CSV file
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to export
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
export const exportProjectToCSV = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);

        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const rows = project.steps.length
            ? project.steps.map((step, index) => ({
                project_id: project._id.toString(),
                project_title: project.title,
                project_description: project.description,
                project_level: project.level,
                project_tags: project.tags.join(", "),
                step_number: index + 1,
                step_title: step.title,
                step_description: step.description,
                step_completed: step.isCompleted ? "Yes" : "No",
                step_created_at: step.createdAt?.toISOString() ?? "",
            }))
            : [
                {
                    project_id: project._id.toString(),
                    project_title: project.title,
                    project_description: project.description,
                    project_level: project.level,
                    project_tags: project.tags.join(", "),
                    step_number: "",
                    step_title: "",
                    step_description: "",
                    step_completed: "",
                    step_created_at: "",
                },
            ];

        const fields = [
            "project_id",
            "project_title",
            "project_description",
            "project_level",
            "project_tags",
            "step_number",
            "step_title",
            "step_description",
            "step_completed",
            "step_created_at",
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(rows);

        const filename = `${project.title.replace(/\s+/g, "_")}.csv`;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @swagger
 * /api/v1/project/{projectId}/export/pdf:
 *   get:
 *     summary: Export project and its steps as a styled PDF file
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to export
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
export const exportProjectToPDF = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);

        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const doc = new PDFDocument({
            size: "A4",
            margins: { top: PDF_SIZES.marginY, bottom: PDF_SIZES.marginY, left: PDF_SIZES.marginX, right: PDF_SIZES.marginX },
            bufferPages: true,
            info: {
                Title: project.title,
                Author: "MERN Roadmap Platform",
                Subject: "Project Export",
            },
        });

        const filename = `${project.title.replace(/\s+/g, "_")}_export.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        doc.pipe(res);

        const { pageWidth, pageHeight, marginX, marginY, contentWidth } = PDF_SIZES;
        const levelColor = LEVEL_COLORS[project.level] ?? PDF_COLORS.accent;

        // ── Page background ────────────────────────────────────────────────────
        const fillBackground = () => {
            doc.rect(0, 0, pageWidth, pageHeight).fill(PDF_COLORS.bg);
        };
        fillBackground();

        // ── Header section ─────────────────────────────────────────────────────
        const HEADER_H = 180;
        drawRoundedRect(doc, 0, 0, pageWidth, HEADER_H, 0, PDF_COLORS.surface);

        // Accent left stripe
        doc.rect(0, 0, 5, HEADER_H).fill(PDF_COLORS.accent);

        // Decorative circle top-right
        doc.save().circle(pageWidth - 60, 30, 80).fillOpacity(0.06).fill(PDF_COLORS.accentSoft).restore();
        doc.save().circle(pageWidth - 20, 80, 50).fillOpacity(0.05).fill(PDF_COLORS.accentSoft).restore();

        // Platform label
        doc
            .fillColor(PDF_COLORS.accentSoft)
            .font(PDF_FONTS.body)
            .fontSize(10)
            .text("MERN ROADMAP PLATFORM", marginX + 10, marginY, { characterSpacing: 1.5 });

        // Project title — measure height manually to avoid doc.y cursor drift
        const titleText = project.title;
        const titleFontSize = 26;
        const titleWidth = contentWidth - 60;
        doc.font(PDF_FONTS.heading).fontSize(titleFontSize);
        const titleHeight = doc.heightOfString(titleText, { width: titleWidth });
        doc
            .fillColor(PDF_COLORS.textPrimary)
            .font(PDF_FONTS.heading)
            .fontSize(titleFontSize)
            .text(titleText, marginX + 10, marginY + 22, { width: titleWidth, lineBreak: true });

        const titleBottom = marginY + 22 + titleHeight + 10;

        // Level badge — tinted background via fillOpacity, text uses the level color
        const badgeY = titleBottom;
        const badgeLabel = project.level;
        doc.font(PDF_FONTS.bold).fontSize(10);
        const badgeW = doc.widthOfString(badgeLabel) + 22;
        doc.save().roundedRect(marginX + 10, badgeY, badgeW, 22, 5).fillColor(levelColor).fillOpacity(0.15).fill().restore();
        doc
            .fillColor(levelColor)
            .fillOpacity(1)
            .font(PDF_FONTS.bold)
            .fontSize(10)
            .text(badgeLabel, marginX + 21, badgeY + 6, { lineBreak: false });

        // Tags
        let tagX = marginX + 10 + badgeW + 10;
        const tagY = badgeY;
        for (const tag of project.tags) {
            const tw = doc.widthOfString(tag, { fontSize: 9 }) + 16;
            if (tagX + tw > pageWidth - marginX) break;
            drawRoundedRect(doc, tagX, tagY, tw, 22, 5, PDF_COLORS.surfaceLight);
            doc
                .fillColor(PDF_COLORS.textSecondary)
                .font(PDF_FONTS.body)
                .fontSize(9)
                .text(tag, tagX + 8, tagY + 6, { lineBreak: false });
            tagX += tw + 6;
        }

        // Export date
        doc
            .fillColor(PDF_COLORS.textMuted)
            .font(PDF_FONTS.body)
            .fontSize(9)
            .text(
                `Exported on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                marginX + 10,
                HEADER_H - 28
            );

        // ── Description section ────────────────────────────────────────────────
        const DESC_Y = HEADER_H + 20;
        drawRoundedRect(doc, marginX, DESC_Y, contentWidth, 2, 0, PDF_COLORS.border);

        doc
            .fillColor(PDF_COLORS.accentSoft)
            .font(PDF_FONTS.bold)
            .fontSize(11)
            .text("DESCRIPTION", marginX, DESC_Y + 12, { characterSpacing: 1 });

        doc
            .fillColor(PDF_COLORS.textSecondary)
            .font(PDF_FONTS.body)
            .fontSize(11)
            .text(project.description, marginX, DESC_Y + 30, { width: contentWidth, lineGap: 4 });

        // ── Steps section ──────────────────────────────────────────────────────
        let cursorY = doc.y + 24;

        // Section header
        drawRoundedRect(doc, marginX, cursorY, contentWidth, 2, 0, PDF_COLORS.border);
        doc
            .fillColor(PDF_COLORS.accentSoft)
            .font(PDF_FONTS.bold)
            .fontSize(11)
            .text("LEARNING PATH", marginX, cursorY + 12, { characterSpacing: 1 });
        cursorY += 32;

        if (project.steps.length === 0) {
            drawRoundedRect(doc, marginX, cursorY, contentWidth, 50, 8, PDF_COLORS.surface);
            doc
                .fillColor(PDF_COLORS.textMuted)
                .font(PDF_FONTS.body)
                .fontSize(11)
                .text("No steps have been added to this project yet.", marginX, cursorY + 18, {
                    width: contentWidth,
                    align: "center",
                });
        }

        for (let i = 0; i < project.steps.length; i++) {
            const step = project.steps[i];

            // Estimate card height to decide page break
            const descHeight = doc.heightOfString(step.description, { width: contentWidth - 80, fontSize: 10 });
            const cardHeight = Math.max(64, descHeight + 46);

            if (cursorY + cardHeight > pageHeight - marginY - 30) {
                doc.addPage();
                fillBackground();
                cursorY = marginY;
            }

            // Card background
            drawRoundedRect(doc, marginX, cursorY, contentWidth, cardHeight, 8, PDF_COLORS.surface);

            // Step number circle
            const circleX = marginX + 26;
            const circleY = cursorY + cardHeight / 2;
            doc.save().circle(circleX, circleY, 13).fillColor(PDF_COLORS.accent).fillOpacity(0.15).fill().restore();
            doc
                .fillColor(PDF_COLORS.accent)
                .fillOpacity(1)
                .font(PDF_FONTS.bold)
                .fontSize(11)
                .text(`${i + 1}`, circleX - 4, circleY - 7, { lineBreak: false });

            // Step title
            doc
                .fillColor(PDF_COLORS.textPrimary)
                .font(PDF_FONTS.bold)
                .fontSize(12)
                .text(step.title, marginX + 52, cursorY + 14, { width: contentWidth - 80, lineBreak: false });

            // Step description
            doc
                .fillColor(PDF_COLORS.textSecondary)
                .font(PDF_FONTS.body)
                .fontSize(10)
                .text(step.description, marginX + 52, cursorY + 32, {
                    width: contentWidth - 80,
                    lineGap: 3,
                });

            cursorY += cardHeight + 10;
        }

        // ── Footer on every page ───────────────────────────────────────────────
        const pageCount = doc.bufferedPageRange().count;
        for (let p = 0; p < pageCount; p++) {
            doc.switchToPage(p);
            doc.rect(0, pageHeight - 36, pageWidth, 36).fill(PDF_COLORS.surface);
            doc.rect(0, pageHeight - 36, pageWidth, 1).fill(PDF_COLORS.border);
            doc
                .fillColor(PDF_COLORS.textMuted)
                .font(PDF_FONTS.body)
                .fontSize(8)
                .text("MERN Roadmap Platform  •  Project Export", marginX, pageHeight - 22, { lineBreak: false });
            doc
                .fillColor(PDF_COLORS.textMuted)
                .font(PDF_FONTS.body)
                .fontSize(8)
                .text(`Page ${p + 1} of ${pageCount}`, pageWidth - marginX - 50, pageHeight - 22, { lineBreak: false });
        }

        doc.end();
    } catch (error) {
        console.log(error.message);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};



/**
 * @swagger
 * /api/v1/project/{projectId}/export/json:
 *   get:
 *     summary: Export project and its steps as a JSON file
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to export
 *     responses:
 *       200:
 *         description: JSON file download
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
export const exportProjectToJSON = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId).select("-__v");

        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const payload = {
            exported_at: new Date().toISOString(),
            project: {
                id: project._id,
                title: project.title,
                description: project.description,
                level: project.level,
                tags: project.tags,
                created_at: project.createdAt,
                updated_at: project.updatedAt,
                steps_count: project.steps.length,
                completed_steps: project.steps.filter((s) => s.isCompleted).length,
                steps: project.steps.map((step, index) => ({
                    number: index + 1,
                    id: step._id,
                    title: step.title,
                    description: step.description,
                    is_completed: step.isCompleted,
                    created_at: step.createdAt,
                })),
            },
        };

        const filename = `${project.title.replace(/\s+/g, "_")}.json`;

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).json(payload);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @swagger
 * /api/v1/project/{projectId}/recommended:
 *   get:
 *     summary: Get recommended projects based on shared tags
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to base recommendations on
 *     responses:
 *       200:
 *         description: List of recommended projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendedProjects:
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
 *         description: Invalid Id
 *       404:
 *         description: Project not found or no related projects exist
 *       500:
 *         description: Internal server error
 */
export const getRecommendedProjects = async (req, res) => {

    try {
        const { projectId } = req.params

        // Check if project id is valid
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid Id' });
        }

        const project = await Project.findById(projectId);

        //check if the project with the given id exists
        if (!project) {
            return res.status(404).json({ success: false, message: `Project not found` })
        }

        const recommendedProjects = await Project.find(
            {
                tags: { $in: project.tags },
                //make sure to not return the current project id 
                _id: { $ne: projectId }
            }
        ).select("-__v")

        //checking if there are recommended projects
        if (!recommendedProjects || recommendedProjects.length === 0) {
            return res.status(404).json({ success: false, message: `No recommended projects found!` })
        }

        return res.status(200).json({
            success: true,
            message: `Recommended projects fetched successfully`,
            projectNumber: recommendedProjects.length,
            recommendedProjects
        })

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message })
    }
}