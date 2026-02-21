import Project from "../models/project.model.js";
import {
    validateProjectData,
    validateProjectQueryString,
    validateProjectUpdateData,
    validateStepsData
} from "../utils/validateProjectData.js";

export const getAllProjects = async (req, res) => {
    try {
        const { q = "", page = 1, limit = 10 } = req.query;

        console.log(q)
        const { isValid, message } = validateProjectQueryString(q, +page, +limit);
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

export const toggleStep = async (req, res) => {
    try {
        const { projectId, stepId } = req.params;

        const project = await Project.findById(projectId);
        if (!project)
            return res.status(404).json({ success: false, message: "Project not found" });

        const step = project.steps.id(stepId);
        if (!step)
            return res.status(404).json({ success: false, message: "Step not found" });

        step.isCompleted = !step.isCompleted;

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Step toggled successfully",
            step,
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message });
    }
};

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