import Quiz from "../model/Quiz.js";

const normalizeAnswersPayload = (payload) => {
    if (Array.isArray(payload)) {
        return payload
            .map((answer, index) => {
                if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
                    const questionIndex = Number.isInteger(answer.questionIndex)
                        ? answer.questionIndex
                        : Number.isInteger(answer.index)
                            ? answer.index
                            : index;

                    return {
                        questionIndex,
                        selectedAnswer: answer.selectedAnswer
                            ?? answer.selectedOption
                            ?? answer.answer
                            ?? answer.value
                            ?? ''
                    };
                }

                return {
                    questionIndex: index,
                    selectedAnswer: answer
                };
            })
            .filter((answer) => answer.selectedAnswer !== undefined && answer.selectedAnswer !== null);
    }

    if (payload && typeof payload === 'object') {
        return Object.entries(payload).map(([key, value]) => ({
            questionIndex: Number.parseInt(key, 10),
            selectedAnswer: value
        }));
    }

    return [];
};

// @desc Create a new quiz
// @route POST /api/quiz/:id/submit
// @access Private
export const submitQuiz = async (req, res, next) => {
    try {
        const rawAnswers = req.body.answers
            ?? req.body.answer
            ?? req.body.userAnswers
            ?? req.body.selectedAnswers;
        const answers = normalizeAnswersPayload(rawAnswers);

        if(!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Answers are required.' });
        }

        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });  
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        if (quiz.completedAt) {
            return res.status(400).json({ message: 'Quiz already completed.' });
        }

        // Process answers and calculate score
        let score = 0;
        const userAnswers = [];

        answers.forEach((answer) => {
            const parsedQuestionIndex = Number.parseInt(answer.questionIndex, 10);
            const normalizedSelectedAnswer = String(answer.selectedAnswer ?? '').trim();

            if (
                Number.isNaN(parsedQuestionIndex)
                || parsedQuestionIndex < 0
                || parsedQuestionIndex >= quiz.questions.length
                || !normalizedSelectedAnswer
            ) {
                return;
            }

            const question = quiz.questions[parsedQuestionIndex];
            const isCorrect = question.correctAnswer === normalizedSelectedAnswer;
            if (isCorrect) {
                score++;
            }
            userAnswers.push({
                questionIndex: parsedQuestionIndex,
                selectedAnswer: normalizedSelectedAnswer,
                isCorrect,
                answeredAt: new Date()
            });
        });

        if (userAnswers.length === 0) {
            return res.status(400).json({ message: 'No valid answers were provided.' });
        }

        // calculate final score and update quiz
        const finalScore = (score / quiz.totalQuestions) * 100;
        userAnswers.forEach((answer) => {
            quiz.questions[answer.questionIndex].userAnswer = [{
                questionIndex: answer.questionIndex,
                selectedAnswer: answer.selectedAnswer,
                isCorrect: answer.isCorrect,
                answeredAt: answer.answeredAt
            }];
        });
        quiz.score = finalScore;
        quiz.completedAt = new Date();
        await quiz.save();
        res.status(200).json({
            success: true,
            data: {
                quizId: quiz._id,
                score,
                correctCount: score,
                totalQuestions: quiz.totalQuestions,
                percentage: finalScore,
                userAnswers
            },
            message: 'Quiz submitted successfully.'
        });

    }catch (error) {
        next(error);
    }
};

// @desc Get quiz results
// @route GET /api/quiz/:id/results
// @access Private
export const getQuizResults = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id })
            .populate('documentId', 'title ');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        if (!quiz.completedAt) {
            return res.status(400).json({ message: 'Quiz not completed yet.' });
        }

        const detailedResults = quiz.questions.map((q, index) => {
            const userAnswer = Array.isArray(q.userAnswer) && q.userAnswer.length
                ? q.userAnswer[q.userAnswer.length - 1]
                : null;

            return {
                questionIndex: index,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                selectedAnswer: userAnswer ? userAnswer.selectedAnswer : null,
                isCorrect: userAnswer ? userAnswer.isCorrect : false,
                explanation: q.explanation || ''
            };
        });
        res.status(200).json({
            success: true,
            data: {
                quiz:{
                    id: quiz._id,
                    title: quiz.title,
                    document: quiz.documentId ,
                    score: quiz.score,
                    totalQuestions: quiz.totalQuestions,
                    completedAt: quiz.completedAt
                },
                results:detailedResults
                },
            message: 'Quiz results retrieved successfully.'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Delete quiz result
// @route DELETE /api/quiz/:id
// @access Private
export const deleteQuizResult = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        await quiz.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Quiz result deleted successfully.'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Get quizzes for a document
// @route GET /api/quiz/:documentId
// @access Private
export const getQuizzes = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({ message: 'Document ID is required.' });
        }
        const quizzes = await Quiz.find({ userId: req.user._id, documentId })
            .populate('documentId', 'title fileName')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes
        });
    }catch (error) {
        next(error);
    }
};

// @desc Get quiz by ID
// @route GET /api/quiz/quiz/:id
// @access Private
export const getQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id })
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        res.status(200).json({
            success: true,
            data: quiz
        });
    }catch (error) {
        next(error);
    }
};
