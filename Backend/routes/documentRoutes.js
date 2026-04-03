import express from 'express';
import {
    uploadDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
} from '../controllers/documentController.js';
import protect from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post(
    '/upload',
    protect,
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
        { name: 'document', maxCount: 1 }
    ]),
    (req, res, next) => {
        req.file = req.files?.file?.[0] || req.files?.pdf?.[0] || req.files?.document?.[0];
        next();
    },
    uploadDocument
);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);
router.delete('/delete/:id', protect, deleteDocument);

export default router;