import Document from "../model/Document.js";
import Flashcard from "../model/Flashcard.js";
import Quiz from "../model/Quiz.js";
import * as aiService from '../utils/geminiService.js';


// @desc Generate flashcards for a document
// @route POST /api/ai/generate-flashcards
// @access Private
export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentId, count = 10 } = req.body;
        const targetCount = Number.parseInt(count, 10) || 10;

        if (!documentId) {
            return res.status(400).json({ message: 'Document ID is required.' });
        }

        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        const cards = await aiService.generateFlashcards(document.extractedText, targetCount);

        if (!cards.length) {
            return res.status(422).json({
                success: false,
                message: 'Unable to generate flashcards from this document content.'
            });
        }

        // Save flashcards to database
        const flashcardSet = await Flashcard.create({
            documentId: document._id,
            userId: req.user._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });
        res.status(200).json({
            success: true,
            data: flashcardSet,
            message: `${cards.length} flashcards generated successfully.`
        });
    } catch (error) {
        next(error);
    }
};

// @desc Generate quiz for a document
// @route POST /api/ai/generate-quiz
// @access Private
export const generateQuiz = async (req, res, next) => {
    try {
    }catch (error) {
        next(error);
    }
};

// @desc Generate summary for a document
// @route POST /api/ai/generate-summary
// @access Private
export const generateSummary = async (req, res, next) => {
    try {
    }catch (error) {
        next(error);
    }
};

// @desc Chat with AI about a document
// @route POST /api/ai/chat
// @access Private
export const chat = async (req, res, next) => {
    try {
    }catch (error) {
        next(error);
    }
};

// @desc Explain a concept from a document
// @route POST /api/ai/explain
// @access Private
export const explainConcept = async (req, res, next) => {  
    try {
    }catch (error) {
        next(error);
    }
};

// @desc Get chat history for a document
// @route GET /api/ai/chat-history/:documentId
// @access Private
export const getChatHistory = async (req, res, next) => {
    try{

    }catch (error) {
        next(error);
    }
};
