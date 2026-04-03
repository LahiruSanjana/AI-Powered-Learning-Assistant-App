import { validationResult } from "express-validator";
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',        
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: [
        {   
            question: { type: String, required: true },
            options: {
                type: [{ type: String, required: true }],
                required: true,
                validate: {
                    validator: (value) => Array.isArray(value) && value.length === 4,
                    message: 'Exactly 4 options are required'
                }
            },
            correctAnswer: { type: String, required: true },
            explanation: { type: String, default: '' },
            userAnswer: [{ 
                questionIndex:{ type: Number, required: true },
                selectedAnswer: { type: String, required: true },
                isCorrect: { type: Boolean, required: true },
                answeredAt: { type: Date, default: Date.now }
            }]
        }],
        score:{
            type: Number,
            default: 0
        },
        totalQuestions:{
            type: Number,
            default: 0
        },
        completedAt: {
            type: Date,
            default: null
        }
},{
    timestamps: true 
});

quizSchema.index({ userId: 1, documentId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
        