import Project from "../models/project.model.js";
import {
    validateProjectData,
    validateProjectQueryString,
    validateProjectUpdateData,
    validateStepsData
} from "../utils/validateProjectData.js";
import User from "../models/user.model.js";

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
 * /api/v1/projects/{projectId}/steps:
 *   post:
 *     summary: Add step(s) to project
 *     tags: [Project Steps]
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
 *               steps:
 *                 type: array
 *                 items:
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Step(s) added successfully
 */
export const createStep = async (req, res) => {
    try {
        const { projectId } = req.params;
        let { steps } = req.body;
        const { isValid, message } = validateStepsData(steps)
        if (!isValid) return res.status(400).json({ success: false, message })

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // If user sends single object → convert to array
        if (!Array.isArray(steps)) {
            steps = [steps];
        }

        project.steps.push(...steps);

        await project.save();

        return res.status(201).json({
            success: true,
            message:
                steps.length > 1
                    ? "Steps added successfully"
                    : "Step added successfully",
            project,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}/steps/{stepId}:
 *   put:
 *     summary: Update project step
 *     tags: [Project Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *       - in: path
 *         name: stepId
 *         required: true
 *     responses:
 *       200:
 *         description: Step updated successfully
 */
export const updateStep = async (req, res) => {
    try {
        const { projectId, stepId } = req.params;
        const { title, description } = req.body;
        const project = await Project.findById(projectId);
        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const step = project.steps.id(stepId);
        if (!step)
            return res.status(404).json({ success: false, message: "Step not found" });

        step.title = title ?? step.title;
        step.description = description ?? step.description;

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Step updated successfully",
            step,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}/steps/{stepId}:
 *   delete:
 *     summary: Delete project step
 *     tags: [Project Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *       - in: path
 *         name: stepId
 *         required: true
 *     responses:
 *       200:
 *         description: Step deleted successfully
 */
export const deleteStep = async (req, res) => {
    try {
        const { projectId, stepId } = req.params;

        const project = await Project.findById(projectId);
        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const step = project.steps.id(stepId);
        if (!step)
            return res.status(404).json({ success: false, message: "Step not found" });

        step.deleteOne();
        await project.save();

        return res.status(200).json({
            success: true,
            message: "Step deleted successfully",
            step,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}/steps/{stepId}/toggle:
 *   patch:
 *     summary: Toggle step completion
 *     tags: [Project Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *       - in: path
 *         name: stepId
 *         required: true
 *     responses:
 *       200:
 *         description: Step toggled successfully
 */
export const toggleStep = async (req, res) => {
    try {
        const { projectId, stepId } = req.params;
        const { id: userId } = req.user;

        const project = await Project.findById(projectId);
        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const step = project.steps.id(stepId);
        if (!step)
            return res.status(404).json({ success: false, message: "Step not found" });

        step.isCompleted = !step.isCompleted;
        await project.save();

        if (step.isCompleted) {
            const user = await User.findById(userId);

            const existingProject = user.progressData.project.find(
                p => p.project.toString() === projectId
            );

            if (!existingProject) {
                // Create new project progress
                user.progressData.project.push({
                    project: projectId,
                    completedSteps: [stepId],
                    totalSteps: project.steps.length,
                    completedCount: 1
                });
            } else {
                const alreadyCompleted = existingProject.completedSteps
                    .some(id => id.toString() === stepId);

                if (!alreadyCompleted) {
                    existingProject.completedSteps.push(stepId);
                    existingProject.completedCount =
                        existingProject.completedSteps.length;
                }
            }

            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Step toggled successfully",
            step,
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/projects/{projectId}/steps:
 *   get:
 *     summary: Get all steps of a project
 *     tags: [Project Steps]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Steps fetched successfully
 *       404:
 *         description: Project or steps not found
 */
export const getAllSteps = async (req, res) => {
    try {
        const { projectId } = req.params
        const project = await Project.findById(projectId);

        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        if (project.steps.length === 0) {
            return res.status(404).json({ success: false, message: "No steps found" });
        }

        return res.status(200).json({ success: true, steps: project.steps, stepsNumber: project.steps.length });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
}