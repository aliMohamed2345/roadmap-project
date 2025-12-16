import express from 'express'
import {
    changePassword,
    Profile,
    updateProfile,
    getAllUsers,
    getSpecificUser,
    deleteUser,
    toggleRole,
    uploadProfileImage
} from '../controllers/users.controllers.js';
import { verifyToken, isAdmin, isIdValid, upload, } from '../middleware/middlewares.js';
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


export default router; 