import express from 'express';
import {
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuizResult
} from '../controllers/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:documentId', getQuizzes);
router.get('/quiz/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);
router.delete('/:id', deleteQuizResult);

export default router;