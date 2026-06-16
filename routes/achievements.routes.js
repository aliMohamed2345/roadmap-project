
import { Router } from "express";
import {
    isAdmin,
    isIdValid,
    verifyToken,
    upload
} from '../middleware/middlewares.js';

import {
    getAllAchievements,
    deleteAchievementById,
    getAchievementById,
    updateAchievementById,
    createAchievement,
    uploadAchievementImage,
    deleteAchievementImage,
    createMultipleAchievement
} from '../controllers/achievements.controller.js';


const router = Router();

router.route('/')
    .get(verifyToken, getAllAchievements)
    .post(verifyToken, isAdmin, createAchievement);

router.post('/bulk', verifyToken, isAdmin, createMultipleAchievement)

router.route('/:id')
    .get(isIdValid, verifyToken, getAchievementById)
    .put(isIdValid, verifyToken, isAdmin, updateAchievementById)
    .delete(isIdValid, verifyToken, isAdmin, deleteAchievementById);

router.put('/:id/upload-image', isIdValid, verifyToken, isAdmin, upload.single('image'), uploadAchievementImage);
router.delete('/:id/delete-image', isIdValid, verifyToken, isAdmin, deleteAchievementImage);

export default router;