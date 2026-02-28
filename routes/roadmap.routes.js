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
    exportRoadmapToCSV
} from "../controllers/roadmap.controllers.js";

import {
    checkApiKey,
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
    getSpecificResource
} from "../controllers/resource.controllers.js"

const router = express.Router()

//Roadmap
router.get("/", checkApiKey, getAllRoadmapData)

router.post('/', checkApiKey, verifyToken, isAdmin, createRoadmap)

router.route("/:id")
    .get(checkApiKey, isIdValid, getSpecificRoadmap)
    .delete(checkApiKey, isIdValid, verifyToken, isAdmin, deleteRoadmap)
    .put(checkApiKey, isIdValid, verifyToken, isAdmin, updateRoadmap)

router.get('/:id/progress', checkApiKey, isIdValid, verifyToken, getUserRoadmapProgress)
router.get('/:id/progress/export/json', checkApiKey, isIdValid, verifyToken, exportRoadmapToJSON)
router.get('/:id/progress/export/pdf', checkApiKey, isIdValid, verifyToken, exportRoadmapToPDF)
router.get('/:id/progress/export/csv', checkApiKey, isIdValid, verifyToken, exportRoadmapToCSV)

//Sections 
router.route('/:id/sections')
    .get(checkApiKey, isIdValid, getAllRoadmapSections)
    .post(checkApiKey, isIdValid, verifyToken, isAdmin, createSection)

router.route('/:id/sections/:sectionId')
    .get(checkApiKey, isIdValid, getSectionData)
    .put(checkApiKey, isIdValid, verifyToken, isAdmin, updateSection)
    .delete(checkApiKey, isIdValid, verifyToken, isAdmin, deleteSection)

router.post('/:id/sections/:sectionId/complete', checkApiKey, isIdValid, verifyToken, toggleCompletionSection)

//Resources
router.route('/:id/sections/:sectionId/resources')
    .post(checkApiKey, isIdValid, verifyToken, isAdmin, createResource)
    .get(checkApiKey, isIdValid, getAllSectionResources)

router.route('/:id/sections/:sectionId/resources/:resourceId')
    .put(checkApiKey, isIdValid, verifyToken, isAdmin, updateResource)
    .delete(checkApiKey, isIdValid, verifyToken, isAdmin, deleteResource)
    .get(checkApiKey, isIdValid, getSpecificResource)

export default router
