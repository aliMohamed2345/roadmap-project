import Project from "../models/project.model.js";
import {
    validateProjectData,
    validateProjectQueryString,
    validateProjectUpdateData,
    validateStepsData
} from "../utils/validateProjectData.js";

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

