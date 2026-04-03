import express from 'express';
import {
    getDashboardProgress,
} from '../controllers/progressController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/dashboard', getDashboardProgress);

export default router;