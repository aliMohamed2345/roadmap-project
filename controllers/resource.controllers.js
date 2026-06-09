import mongoose from 'mongoose'
import Resource from '../models/resource.model.js'
import { validateResourceData } from '../utils/validateRoadmapData.js'
import Section from '../models/section.model.js'
import { generateResourcesPrompt } from '../utils/prompts.js'
import Roadmap from '../models/roadmap.model.js'
import AI from '../lib/ai.js'
import { validateYoutubeVideo } from '../utils/validateYoutubeVideo.js'
import { isUrlAvailable } from '../utils/isUrlAvailable.js'
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

/**
 * @swagger
 * /api/v1/roadmaps/{id}/sections/{sectionId}/resources/generate-resource:
 *   post:
 *     summary: Generate learning resources for a section using AI
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Roadmap ID
 *
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - video
 *             - article
 *             - course
 *           default: video
 *         description: Resource type to generate
 *
 *       - in: query
 *         name: number
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 1
 *         description: Number of resources to generate
 *
 *     responses:
 *       200:
 *         description: Resources generated successfully
 *
 *       400:
 *         description: Invalid roadmap id, section id, resource type, or number
 *
 *       404:
 *         description: Roadmap or section not found
 *
 *       500:
 *         description: AI generation failed or internal server error
 */
export const generateAIResource = async (req, res) => {
    try {
        const { sectionId, id: roadmapId } = req.params;
        const { number, type } = req.query;

        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sectionId",
            });
        }

        const resourceCount = +(number ?? 1);

        if (
            isNaN(resourceCount) ||
            resourceCount < 1 ||
            resourceCount > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Number must be between 1 and 5",
            });
        }

        const allowedTypes = [
            "video",
            "article",
            "course",
        ];

        const resourceType = type ?? "video";

        if (!allowedTypes.includes(resourceType)) {
            return res.status(400).json({
                success: false,
                message:
                    "Resource type must be video, article, or course",
            });
        }

        const roadmap = await Roadmap.findById(roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found",
            });
        }

        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        // Generate prompt
        const prompt = generateResourcesPrompt(
            roadmap.title ?? "",
            section.title ?? "",
            section.description ?? "",
            section.difficulty ?? "Beginner",
            resourceType,
            resourceCount)

        const aiResponse = await AI(prompt);

        // Clean markdown
        const cleanedResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let parsedResponse;

        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON",
            });
        }

        // Validate structure
        if (
            !parsedResponse.resources ||
            !Array.isArray(parsedResponse.resources)
        ) {
            return res.status(500).json({
                success: false,
                message: "Invalid AI response structure",
            });
        }

        // Validate count
        if (
            parsedResponse.resources.length !== resourceCount
        ) {
            return res.status(500).json({
                success: false,
                message: `Expected ${resourceCount} resources but received ${parsedResponse.resources.length}`,
            });
        }

        // Validate resources
        const uniqueUrls = new Set();

        for (const resource of parsedResponse.resources) {

            //checking the main resource structure exist
            if (
                !resource.title ||
                !resource.url ||
                !resource.type
            ) {
                return res.status(500).json({
                    success: false,
                    message: "AI returned malformed resources",
                });
            }

            //checking if the resource type is valid 
            if (!allowedTypes.includes(resource.type)) {
                return res.status(500).json({
                    success: false,
                    message: "AI returned invalid resource type",
                });
            }

            // checking if ai resource type matching the user resource type 
            if (resource.type !== resourceType) {
                return res.status(500).json({
                    success: false,
                    message: "AI returned incorrect resource type",
                });
            }

            // checking if the resource url is unique
            if (
                uniqueUrls.has(
                    resource.url.toLowerCase()
                )
            ) {
                return res.status(500).json({
                    success: false,
                    message: "AI generated duplicate resources",
                });
            }

            // Validate URLs
            if (resource.type === "video") {
                //checking is the video url is valid and exist on youtube
                const isYoutubeVideoValid =
                    await validateYoutubeVideo(resource.url);

                if (!isYoutubeVideoValid) {
                    return res.status(500).json({
                        success: false,
                        message: "AI generated invalid youtube video",
                    });
                }
            } else {
                //checking is the resources (article or course) url is valid and exist on youtube
                const isUrlValid =
                    await isUrlAvailable(resource.url);

                if (!isUrlValid) {
                    return res.status(500).json({
                        success: false,
                        message: "AI generated invalid resource URL",
                    });
                }
            }

            uniqueUrls.add(
                resource.url.toLowerCase()
            );
        }

        // Prepare resources
        const resourcesToCreate =
            parsedResponse.resources.map(
                (resource) => ({
                    title: resource.title,
                    url: resource.url,
                    type: resource.type,
                    sectionId,
                })
            );

        // Save resources
        const resources =
            await Resource.insertMany(
                resourcesToCreate
            );

        const resourceIds = resources.map(
            (resource) => resource._id
        );

        // Update section
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: {
                    resources: {
                        $each: resourceIds,
                    },
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: `${resources.length} resources generated successfully`,
            resourcesCount: resources.length,
            resources,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};