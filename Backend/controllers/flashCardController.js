import Flashcard from "../model/Flashcard.js";

// @desc Get all flashcards for a document
// @route GET /api/flashcards/document/:documentId
// @access Private
export const getFlashcards = async (req, res, next) => {
    try{
        const flashcards = await Flashcard.find({ documentId: req.params.documentId, userId: req.user._id })
        .populate('documentId', 'title')
        .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: flashcards.length,
            data: flashcards
        });
    }catch (error) {
        next(error);
    }
};

// @desc Get all flashcards for a user
// @route GET /api/flashcards/all
// @access Private
export const getAllFlashcards = async (req, res, next) => {
    try{
        const flashcardSets = await Flashcard.find({
            userId: req.user._id
        })
        .populate('documentId', 'title')
        .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: flashcardSets.length,
            data: flashcardSets
        });
    }catch (error) {
        next(error);
    }
};

// @desc Review a flashcard
// @route POST /api/flashcards/:setId/cards/:cardId/review
// @access Private
export const reviewFlashcard = async (req, res, next) => {
    try{
        const flashcardSet = await Flashcard.findOne({ _id: req.params.setId, userId: req.user._id });
        if (!flashcardSet) {
            return res.status(404).json({ success: false, error: 'Flashcard not found' });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);
        if (cardIndex === -1) {
            return res.status(404).json({ success: false, error: 'Card not found in flashcard set' });
        }

        flashcardSet.cards[cardIndex].lastReviewed = Date.now();
        flashcardSet.cards[cardIndex].reviewCount = (flashcardSet.cards[cardIndex].reviewCount || 0) + 1;

        await flashcardSet.save();
        return res.status(200).json({
            success: true,
            data: flashcardSet.cards[cardIndex],
            message: 'Flashcard reviewed successfully'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Toggle flashcard star
// @route PUT /api/flashcards/:setId/cards/:cardId/star
// @access Private
export const toggleFlashcard = async (req, res, next) => {
    try{
        const flashcardSet = await Flashcard.findOne({ _id: req.params.setId, userId: req.user._id });
        if (!flashcardSet) {
            return res.status(404).json({ success: false, error: 'Flashcard not found' });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({ success: false, error: 'Card not found in flashcard set' });
        }

        flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

        await flashcardSet.save();
        return res.status(200).json({
            success: true,
            data: flashcardSet.cards[cardIndex],
            message: flashcardSet.cards[cardIndex].isStarred ? 'Flashcard starred' : 'Flashcard unstarred'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Delete a flashcard
// @route DELETE /api/flashcards/:id
// @access Private
export const deleteFlashcard = async (req, res, next) => {
    try{
        const flashcardSet = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
        if (!flashcardSet) {
            return res.status(404).json({ success: false, error: 'Flashcard not found' });
        }

        await flashcardSet.deleteOne();
        return res.status(200).json({
            success: true,
            message: 'Flashcard deleted successfully'
        });
    }catch (error) {
        next(error);
    }
};

