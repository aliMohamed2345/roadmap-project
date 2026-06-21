import express from "express";
import {
    getAllRoadmapData,
    getSpecificRoadmap,
    createRoadmap,
    deleteRoadmap,
    updateRoadmap,
    getUserRoadmapProgress,
    exportRoadmapToJSON,
    exportRoadmapToPDF,
    exportRoadmapToCSV,
    getRecommendedRoadmaps,
    RemoveRoadmapImage,
    uploadRoadmapImage
} from "../controllers/roadmap.controllers.js";

import {
    upload,
    isAdmin,
    isIdValid,
    verifyToken
} from "../middleware/middlewares.js";

import {
    getSectionData,
    createSection,
    deleteSection,
    getAllRoadmapSections,
    updateSection,
    toggleCompletionSection
} from "../controllers/section.controllers.js";

import {
    createResource,
    deleteResource,
    getAllSectionResources,
    updateResource,
    getSpecificResource, generateAIResource
} from "../controllers/resource.controllers.js"

const router = express.Router()

//Roadmap
router.get("/", getAllRoadmapData)

router.post('/', verifyToken, isAdmin, createRoadmap)

router.route("/:id")
    .get(isIdValid, getSpecificRoadmap)
    .delete(isIdValid, verifyToken, isAdmin, deleteRoadmap)
    .put(isIdValid, verifyToken, isAdmin, updateRoadmap)

router.get('/:id/recommended', isIdValid, getRecommendedRoadmaps)
router.get('/:id/progress', isIdValid, verifyToken, getUserRoadmapProgress)
router.get('/:id/progress/export/json', isIdValid, verifyToken, exportRoadmapToJSON)
router.get('/:id/progress/export/pdf', isIdValid, verifyToken, exportRoadmapToPDF)
router.get('/:id/progress/export/csv', isIdValid, verifyToken, exportRoadmapToCSV)

//Sections 
router.route('/:id/sections')
    .get(isIdValid, getAllRoadmapSections)
    .post(isIdValid, verifyToken, isAdmin, createSection)

router.route('/:id/sections/:sectionId')
    .get(isIdValid, getSectionData)
    .put(isIdValid, verifyToken, isAdmin, updateSection)
    .delete(isIdValid, verifyToken, isAdmin, deleteSection)

router.post('/:id/sections/:sectionId/complete', isIdValid, verifyToken, toggleCompletionSection)

//Resources
router.route('/:id/sections/:sectionId/resources')
    .post(isIdValid, verifyToken, isAdmin, createResource)
    .get(isIdValid, getAllSectionResources)

router.route('/:id/sections/:sectionId/resources/:resourceId')
    .put(isIdValid, verifyToken, isAdmin, updateResource)
    .delete(isIdValid, verifyToken, isAdmin, deleteResource)
    .get(isIdValid, getSpecificResource)

router.post('/:id/sections/:sectionId/resources/generate-resources', isIdValid, generateAIResource)

router.put("/:id/upload-image", isIdValid, verifyToken, isAdmin, upload.single("image"), uploadRoadmapImage)
router.delete("/:id/delete-image", isIdValid, verifyToken, isAdmin, RemoveRoadmapImage)

export default router
