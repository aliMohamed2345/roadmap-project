import express from 'express'
import {
    changePassword,
    getAllUsers,
    getSpecificUser,
    deleteUser,
    toggleRole,
} from '../controllers/users.controllers.js';
import { verifyToken, isAdmin, isIdValid, upload, } from '../middleware/middlewares.js';
import {
    Profile,
    deleteProfileImage,
    updateProfile,
    uploadProfileImage
} from '../controllers/profile.controllers.js';
const router = express.Router();

router.route('/profile')
    .get(verifyToken, Profile)
    .put(verifyToken, updateProfile)
    .delete(verifyToken, deleteUser)
router.put('/profile/change-password', verifyToken, changePassword)
router.get('/', verifyToken, isAdmin, getAllUsers)
router.get('/:id', isIdValid, verifyToken, isAdmin, getSpecificUser)
router.put('/:id/role', isIdValid, verifyToken, isAdmin, toggleRole)
router.put('/profile/upload-image', verifyToken, upload.single('image'), uploadProfileImage);
router.delete('/profile/delete-image', verifyToken, deleteProfileImage);

export default router; 