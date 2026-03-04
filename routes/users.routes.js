import express from 'express'
import {
    changePassword,
    getAllUsers,
    getSpecificUser,
    deleteUser,
    toggleRole,
    updateUser
} from '../controllers/users.controllers.js';

import {
    verifyToken,
    isAdmin,
    isIdValid,
    upload,
} from '../middleware/middlewares.js';

import {
    Profile,
    deleteProfileImage,
    updateProfile,
    uploadProfileImage,
    deleteProfile
} from '../controllers/profile.controllers.js';
const router = express.Router();

router.route('/profile')
    .get(verifyToken, Profile)
    .put(verifyToken, updateProfile)
    .delete(verifyToken, deleteProfile)

router.put('/profile/change-password', verifyToken, changePassword)

router.get('/', verifyToken, isAdmin, getAllUsers)

router.route("/:id")
    .get(isIdValid, verifyToken, getSpecificUser)
    .delete(isIdValid, verifyToken, isAdmin, deleteUser)
    .put(isIdValid, verifyToken, isAdmin, updateUser)

router.put('/:id/role', isIdValid, verifyToken, isAdmin, toggleRole)

router.put('/profile/upload-image', verifyToken, upload.single('image'), uploadProfileImage);

router.delete('/profile/delete-image', verifyToken, deleteProfileImage);

export default router; 