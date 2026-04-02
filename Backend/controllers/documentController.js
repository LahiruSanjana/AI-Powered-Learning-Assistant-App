import e from 'express';
import Document from '../model/Document.js';
import Flashcard from '../model/Flashcard.js';
import Quiz from '../model/Quiz.js';
import {extractTextFromPDF} from '../utils/pdfPrarser.js';
import {chunkText} from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { count } from 'console';

export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }
        const title = req.body.title;
        if (!title) {
            await fs.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Title is required'

            });
    }
    // construct the url for the upload file
    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    const document = await Document.create({
        userId: req.user._id,
        title,
        fileName: req.file.filename,
        filePath: fileUrl,
        fileSize: req.file.size,
        status: 'processing'
    });

    processPDF(document._id, req.file.path).catch((err) => {
        console.error('Error processing PDF:', err);
    });
    return res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully and is being processed'
    });
}
    catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch((err) => console.error('Error deleting file:', err));
        }
        next(error);
    }
};

const processPDF = async (documentId, filePath) => {
    try {
        const { text } = await extractTextFromPDF(filePath);

        const chunks = chunkText(text, { chunkSize: 1000, overlap: 200, minChunkLength: 100 });

        await Document.findByIdAndUpdate(documentId, 
            {
                extractedText: text,
                chunks: chunks,
                status: 'ready'
            });
            console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks.`);
    }catch (error) {
        console.error(`Error processing document ${documentId}:`, error);
        await Document.findByIdAndUpdate(documentId, { status: 'error' });
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(req.user._id) }
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcards'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: '$flashcards' },
                    quizCount: { $size: '$quizzes' }
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcards: 0,
                    quizzes: 0
                }
            },
            {
                $sort: { uploadDate : -1 }
            }
        ]);
        return res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    }
    catch (error) {
        next(error);
    }
};

export const getDocumentById = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });
        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        const flashcardCount = await Flashcard.countDocuments({ documentId: document._id, userId: req.user._id });
        const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

        document.lastAccessed = Date.now();
        await document.save();

        // combine document data with flashcard and quiz counts
        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        return res.status(200).json({
            success: true,
            data: documentData
        });

    }
    catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        await fs.unlink(document.filePath).catch((err) => console.error('Error deleting file:', err));

        await document.deleteOne();
        return res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};

