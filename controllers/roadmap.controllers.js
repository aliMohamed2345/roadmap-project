import Roadmap from './../models/roadmap.model.js'
import Section from '../models/section.model.js'
import Resource from '../models/resource.model.js'
import User from '../models/user.model.js'
import { validateResourceData, validateRoadmapData, validateSectionData } from '../utils/validateRoadmapData.js'
import mongoose from 'mongoose'

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
 * /api/v1/roadmap/{id}/sections:
 *   get:
 *     summary: Get all sections of a roadmap
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sections fetched successfully
 */
export const getAllRoadmapSections = async (req, res) => {
    try {
        const { id: roadmapId } = req.params;

        const sections = await Section.find({ roadmapId }).populate('resources');
        if (!sections) return res.status(404).json({ success: false, message: "Sections not found" })

        if (sections.length === 0) return res.status(200).json({ success: false, message: "No sections available. Please add a new one." })

        return res.status(200).json({ success: true, sections })
    } catch (error) {
        console.error("Get User Roadmap Progress Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

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
 * /api/v1/roadmap/{id}/sections:
 *   post:
 *     summary: Create section
 *     tags: [Sections]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [title, description, difficulty]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *     responses:
 *       201:
 *         description: Section created
 */
export const createSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty } = req.body

        //validate the user input 
        const { isValid, message } = validateSectionData(title, description, difficulty)
        if (!isValid) return res.status(400).json({ success: false, message })

        //checking if the roadmap exist 
        const isRoadmapExist = await Roadmap.findById(id).lean()
        if (!isRoadmapExist) return res.status(404).json({ success: false, message: `Roadmap not found` })

        //checking if the section exist
        const isSectionExist = await Section.findOne({ title, roadmapId: id }).lean()
        if (isSectionExist) return res.status(400).json({ success: false, message: `Section already exist` })

        const section = await Section.create({ title, description, difficulty, roadmapId: id })
        await Roadmap.findByIdAndUpdate(id, { $push: { sections: section._id } }, { new: true });

        return res.status(201).json({ success: true, message: "Section created successfully", section });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/sections/{sectionId}:
 *   get:
 *     summary: Get section data
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section fetched
 */
export const getSectionData = async (req, res) => {
    try {
        const { sectionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sectionId))
            return res.status(400).json({ success: false, message: "Invalid sectionId" });

        const section = await Section.findById(sectionId).populate('resources', 'title url type').lean();
        if (!section)
            return res.status(404).json({ success: false, message: "Section not found" });

        return res.status(200).json({ success: true, section });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/sections/{sectionId}:
 *   put:
 *     summary: Update section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section updated successfully
 */
export const updateSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title, description, difficulty } = req.body

        if (!mongoose.Types.ObjectId.isValid(sectionId)) return res.status(400).json({ success: false, message: 'Invalid sectionId' });

        //validate the user input 
        const { isValid, message } = validateSectionData(title, description, difficulty)
        if (!isValid) return res.status(400).json({ success: false, message })


        const updatedSection = await Section.findByIdAndUpdate(sectionId, { title, description, difficulty }, { new: true })
        return res.status(200).json({ success: true, message: "Section updated successfully", updatedSection });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/sections/{sectionId}:
 *   delete:
 *     summary: Delete section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted
 */
export const deleteSection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ success: false, message: 'Invalid sectionId' });
        }

        // Check if section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        // Delete all resources related to this section
        const resources = await Resource.deleteMany({ sectionId });

        //checking the existence of the resources
        if (!resources) return res.status(404).json({ success: false, message: "Resources not found" });

        // Delete the section
        await Section.findByIdAndDelete(sectionId);

        return res.status(200).json({
            success: true,
            message: "Section and related resources deleted successfully"
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/sections/{sectionId}/toggle:
 *   patch:
 *     summary: Toggle section completion
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completion toggled
 */
export const toggleCompletionSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const userId = req.user.id;

        //  Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ success: false, message: "Section not found" });
        }

        //  Validate roadmap exists
        const roadmap = await Roadmap.findById(section.roadmapId).populate('sections');
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        const user = await User.findById(userId);

        // Find user's progress for this roadmap
        let progress = user.progressData.roadmap.find(e =>
            e.roadmap.toString() === roadmap._id.toString()
        );

        // If user has no progress entry, create it
        if (!progress) {
            progress = {
                roadmap: roadmap._id,
                completedSections: [],
                numberOfAllSections: roadmap.sections.length
            };
            user.progressData.roadmap.push(progress);
        }

        // Toggle completion
        const isAlreadyCompleted = progress.completedSections.some(
            id => id.toString() === sectionId.toString()
        );

        if (isAlreadyCompleted) {
            // Remove section from completed list
            progress.completedSections = progress.completedSections.filter(
                id => id.toString() !== sectionId.toString()
            );
        } else {
            // Add section to completed list
            progress.completedSections.push(sectionId);
        }

        // 7. Save user progress
        await user.save();

        return res.status(200).json({
            success: true,
            message: isAlreadyCompleted
                ? "Section marked as incomplete"
                : "Section marked as complete",
            progress: {
                completed: progress.completedSections.length,
                total: progress.numberOfAllSections,
                roadmapId: roadmap._id
            }
        });

    } catch (error) {
        console.error("Toggle Section Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @swagger
 * /api/v1/sections/{sectionId}/resources:
 *   post:
 *     summary: Create resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
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
 *             required: [url, title, type]
 *             properties:
 *               url:
 *                 type: string
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created
 */
export const createResource = async (req, res) => {
    try {
        const { sectionId } = req.params
        const { url, title, type } = req.body

        const { isValid, message } = validateResourceData(url, title, type)
        if (!isValid) return res.status(400).json({ success: false, message })

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ success: false, message: `Section not found` })


        const resource = await Resource.create({ url, title, type, sectionId });

        await Section.findByIdAndUpdate(sectionId, { $push: { resources: resource._id } }, { new: true });
        return res.status(201).json({ success: true, message: "Resource created successfully", resource });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/sections/{sectionId}/resources:
 *   get:
 *     summary: Get all resources for a section
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         description: ID of the section
 *         schema:
 *           type: string
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resources fetched
 */
export const getAllSectionResources = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const resources = await Resource.find({ sectionId });
        if (!resources) return res.status(404).json({ success: false, message: `Resources not found` })

        if (resources.length === 0) return res.status(200).json({ success: false, message: `No resources available.Please add a new one` })

        return res.status(200).json({ success: true, resources });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/resources/{resourceId}:
 *   put:
 *     summary: Update resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key required
 *     responses:
 *       200:
 *         description: Resource updated successfully
 */
export const updateResource = async (req, res) => {
    try {
        const { url, title, type } = req.body
        const { resourceId } = req.params

        // validate the resourceId
        if (!mongoose.Types.ObjectId.isValid(resourceId)) return res.status(400).json({ success: false, message: 'Invalid resourceId' });

        //validate the user input
        const { isValid, message } = validateResourceData(url, title, type)
        if (!isValid) return res.status(400).json({ success: false, message })

        const updatedResource = await Resource.findByIdAndUpdate(resourceId, { url, title, type }, { new: true })

        if (!updatedResource) return res.status(404).json({ success: false, message: "Resource not found" })

        return res.status(200).json({ success: true, message: "Resource updated successfully", updatedResource });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/resources/{resourceId}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         description: ID of the resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource fetched
 */
export const getSpecificResource = async (req, res) => {
    try {
        const { resourceId } = req.params

        // validate the resourceId
        if (!mongoose.Types.ObjectId.isValid(resourceId)) return res.status(400).json({ success: false, message: 'Invalid resourceId' });

        //get the resource by id
        const resource = await Resource.findById(resourceId);
        if (!resource) return res.status(404).json({ success: false, message: "Resource not found" })

        return res.status(200).json({ success: true, resource });
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/resources/{resourceId}:
 *   delete:
 *     summary: Delete resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 */
export const deleteResource = async (req, res) => {
    try {
        const { resourceId } = req.params

        // validate the resourceId
        if (!mongoose.Types.ObjectId.isValid(resourceId)) return res.status(400).json({ success: false, message: 'Invalid resourceId' });

        const resource = await Resource.findByIdAndDelete(resourceId);
        if (!resource) return res.status(404).json({ success: false, message: "Resource not found" })

        return res.status(200).json({ success: true, message: "Resource deleted successfully" })
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}