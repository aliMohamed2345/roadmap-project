import { Router } from "express";
import {
    getSpecificProject,
    updateSpecificProject,
    createProject,
    createStep,
    deleteSpecificProject,
    toggleStep,
    deleteStep,
    getAllProjects,
    updateStep,
    getAllSteps
} from "../controllers/project.controllers.js";
import { verifyToken, isAdmin } from "../middleware/middlewares.js";

const router = Router();

router.route("/")
    .get(getAllProjects)
    .post(verifyToken, isAdmin, createProject);

router.route("/:projectId")
    .get(verifyToken, getSpecificProject)
    .put(verifyToken, isAdmin, updateSpecificProject)
    .delete(verifyToken, isAdmin, deleteSpecificProject);

router.route('/:projectId/steps')
    .post(verifyToken, isAdmin, createStep)
    .get(verifyToken, getAllSteps)
router.route("/:projectId/steps/:stepId")
    .put(verifyToken, isAdmin, updateStep)
    .patch(verifyToken, toggleStep)
    .delete(verifyToken, isAdmin, deleteStep);

export default router;