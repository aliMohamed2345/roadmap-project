import mongoose from 'mongoose'
import Resource from '../models/resource.model.js'
import { validateResourceData } from '../utils/validateRoadmapData.js'
import Section from '../models/section.model.js'
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