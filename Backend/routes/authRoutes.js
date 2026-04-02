import express from 'express';
import { body } from 'express-validator';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .exists()
        .withMessage('Password is required')
];


router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

export default router;