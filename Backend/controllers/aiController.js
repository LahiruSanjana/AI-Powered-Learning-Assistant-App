import ChatHistory from "../model/ChatHistory.js";
import Document from "../model/Document.js";
import Flashcard from "../model/Flashcard.js";
import Quiz from "../model/Quiz.js";
import geminiService, * as aiService from '../utils/geminiService.js';

const findRelevantChunks = (chunks = [], query = '', maxResults = 3) => {
    if (!Array.isArray(chunks) || chunks.length === 0) {
        return [];
    }

    const normalizedQuery = String(query || '').toLowerCase().trim();
    if (!normalizedQuery) {
        return chunks.slice(0, maxResults);
    }

    const tokens = normalizedQuery
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2);

    if (tokens.length === 0) {
        return chunks.slice(0, maxResults);
    }

    return chunks
        .map((chunk) => {
            const content = String(chunk?.content || '').toLowerCase();
            let score = 0;

            for (const token of tokens) {
                if (content.includes(token)) {
                    score += 1;
                }
            }

            return { ...chunk, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...chunk }) => chunk);
};


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
        const {documentId,numQuestions = 10,title} = req.body;
        const targetQuestionCount = Number.parseInt(numQuestions, 10) || 10;
        if (!documentId) {
            return res.status(400).json({ message: 'Document ID is required.' });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        const questions = await geminiService.generateQuiz(document.extractedText, targetQuestionCount);
        if (!questions.length) {
            return res.status(422).json({
                success: false,
                message: 'Unable to generate quiz questions from this document content.'
            });
        }

        const quiz = await Quiz.create({
            documentId: document._id,
            userId: req.user._id,
            title: title || `Quiz for ${document.title}`,
            questions: questions.map(q => ({
                question: q.question,
                options: q.options,
                userAnswer: [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || ''
            })),
            totalQuestions: questions.length,
            score: 0,
            completedAt: null
        });
        res.status(200).json({
            success: true,
            data: quiz,
            message: `${questions.length} quiz questions generated successfully.`
        });
    }catch (error) {
        next(error);
    }
};

// @desc Generate summary for a document
// @route POST /api/ai/generate-summary
// @access Private
export const generateSummary = async (req, res, next) => {
    try {
        const { documentId } = req.body;
        if (!documentId) {
            return res.status(400).json({ message: 'Document ID is required.' });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        const summary = await aiService.generateSummary(document.extractedText);
        if (!summary) {
            return res.status(422).json({
                success: false,
                message: 'Unable to generate summary from this document content.'
            });
        }
        res.status(200).json({
            success: true,
            data: summary,
            message: 'Summary generated successfully.'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Chat with AI about a document
// @route POST /api/ai/chat
// @access Private
export const chat = async (req, res, next) => {
    try {
        const { documentId, message } = req.body;
        if (!documentId || !message) {
            return res.status(400).json({ message: 'Document ID and message are required.' });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        const relevantChunks = findRelevantChunks(document.chunks,message,3);
        const chunksIndices = relevantChunks.map((c) => c.chunkIndex);

        let chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId: document._id });
        if (!chatHistory) {
            chatHistory = await ChatHistory.create({ userId: req.user._id, documentId: document._id, messages: [] });
        }

        const context = relevantChunks.map((chunk) => chunk.content).join('\n\n');
        const historyForModel = (chatHistory.messages || []).map((item) => ({
            role: item.role,
            content: item.content
        }));

        const response = await aiService.chatWithDocument({
            question: message,
            context,
            history: historyForModel
        });

        // Update chat history
        chatHistory.messages.push({ role: 'user', content: message, relevantChunks: chunksIndices });
        chatHistory.messages.push({ role: 'assistant', content: response, relevantChunks: chunksIndices });
        await chatHistory.save();
        if (!response) {
            return res.status(422).json({
                success: false,
                message: 'Unable to generate response from AI.'
            });
        }
        res.status(200).json({
            success: true,
            data: response,
            message: 'Response generated successfully.'
        });
    }catch (error) {
        next(error);
    }
};

// @desc Explain a concept from a document
// @route POST /api/ai/explain
// @access Private
export const explainConcept = async (req, res, next) => {  
    try {
        const { documentId, concept } = req.body;
        if (!documentId || !concept) {
            return res.status(400).json({ message: 'Document ID and concept are required.' });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        //find relevant chunk for the concept
        const relevantChunks = findRelevantChunks(document.chunks,concept,1);
        const context = relevantChunks.map((chunk) => chunk.content).join('\n\n');

        const explanation = await aiService.explainConcept({
            concept,
            context
        });
        res.status(200).json({
            success: true,
            data: explanation,
            message: 'Concept explained successfully.',
            relevantChunks: relevantChunks.map((c) => c.chunkIndex)
        });
    }catch (error) {
        next(error);
    }
};

// @desc Get chat history for a document
// @route GET /api/ai/chat-history/:documentId
// @access Private
export const getChatHistory = async (req, res, next) => {
    try{
        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({ message: 'Document ID is required.' });
        }
        const chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId })
            .select('messages');
        if (!chatHistory) {
            return res.status(404).json({ message: 'Chat history not found.' });
        }
        res.status(200).json({
            success: true,
            data: chatHistory.messages,
            message: 'Chat history retrieved successfully.'
        });
    }catch (error) {
        next(error);
    }
};
