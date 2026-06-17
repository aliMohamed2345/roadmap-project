import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import { validateStepsData } from "../utils/validateProjectData.js";

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

        // ── Update user progress & check achievements (complete only) ─
        let newAchievements = [];

        if (step.isCompleted) {
            const user = await User.findById(userId);

            const existingProject = user.progressData.project.find(
                p => p.project.toString() === projectId
            );

            if (!existingProject) {
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
                    existingProject.completedCount = existingProject.completedSteps.length;
                }
            }

            await user.save();

            newAchievements = await checkAndGrantAchievements(user, "step_complete");
        }
        // ─────────────────────────────────────────────────────────────

        return res.status(200).json({
            success: true,
            message: "Step toggled successfully",
            step,
            ...(newAchievements.length > 0 && {
                newAchievements: newAchievements.map(a => ({
                    title: a.title,
                    description: a.description,
                    image: a.image,
                }))
            })
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