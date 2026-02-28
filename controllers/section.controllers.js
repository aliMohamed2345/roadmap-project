import Section from "../models/section.model.js";
import { validateSectionData } from "../utils/validateRoadmapData.js";
import Roadmap from "../models/roadmap.model.js";
import Resource from "../models/resource.model.js";
import User from "../models/user.model.js";
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