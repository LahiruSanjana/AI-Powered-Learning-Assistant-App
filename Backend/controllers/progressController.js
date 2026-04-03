import Document from "../model/Document.js";
import Flashcard from "../model/Flashcard.js";
import Quiz from "../model/Quiz.js";

// @desc Get dashboard progress
// @route GET /api/progress/dashboard
// @access Private
export const getDashboardProgress = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const documentCount = await Document.countDocuments({ userId });
        const flashcardCount = await Flashcard.countDocuments({ userId });
        const quizCount = await Quiz.countDocuments({ userId });
        const completedQuizzes = await Quiz.countDocuments({ userId, score: { $gte: 80 } });

        const flashcardSets = await Flashcard.find({ userId });
        let totalFlashcards = 0;
        let reviewedFlashcards = 0;
        let starredFlashcards = 0;
        flashcardSets.forEach(set => {
            totalFlashcards += set.cards.length;
            reviewedFlashcards += set.cards.filter(card => card.lastReviewed).length;
            starredFlashcards += set.cards.filter(card => card.isStarred).length;
        });

        // Get quiz statistics
        const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
        const averageQuizScoreAgg = await Quiz.aggregate([
            { $match: { userId: req.user._id, completedAt: { $ne: null } } },
            { $group: { _id: null, averageScore: { $avg: '$score' } } }
        ]);

        const averageQuizScore = averageQuizScoreAgg.length
            ? Number(averageQuizScoreAgg[0].averageScore.toFixed(2))
            : 0;

        // Recent activity
        const recentDocuments = await Document.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title createdAt');
        const recentQuizzes = await Quiz.find({ userId })
            .sort({ completedAt: -1 })
            .limit(5)
            .populate('documentId', 'title')
            .select('score totalQuestions completedAt');

        // Study streaks (simplified example)
        const studystreak = Math.floor(Math.random() * 7) + 1; // Replace with real streak calculation

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    documents: documentCount,
                    flashcardSets: flashcardCount,
                    totalFlashcards,
                    reviewedFlashcards,
                    starredFlashcards,
                    quizzes: quizCount,
                    completedQuizzes,
                    averageQuizScore,
                    studyStreak: studystreak
                },
                recentActivity: {
                    documents: recentDocuments,
                    quizzes: recentQuizzes      
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
