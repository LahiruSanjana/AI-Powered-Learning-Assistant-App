import express from "express";
import {
    getFlashcards,
    getAllFlashcards,
    reviewFlashcard,
    toggleFlashcard,
    deleteFlashcard
} from "../controllers/flashCardController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.get('/all', protect, getAllFlashcards);
router.get('/document/:documentId', protect, getFlashcards);
router.post('/:setId/cards/:cardId/review', protect, reviewFlashcard);
router.put('/:setId/cards/:cardId/star', protect, toggleFlashcard);
router.delete('/:id', protect, deleteFlashcard);

export default router;
