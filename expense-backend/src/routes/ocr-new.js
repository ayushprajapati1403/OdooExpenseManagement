import express from 'express';
import multer from 'multer';
import { OCRController } from '../controllers/ocrController.js';
import { authenticateToken } from '../middlewares/auth.js';
const router = express.Router();
const ocrController = new OCRController();
// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Process receipt with OCR
router.post('/process-receipt', authenticateToken, upload.single('receipt'), ocrController.processReceipt.bind(ocrController));
// Create expense from receipt
router.post('/create-expense', authenticateToken, upload.single('receipt'), ocrController.createExpenseFromReceipt.bind(ocrController));
// Get supported formats
router.get('/formats', authenticateToken, ocrController.getSupportedFormats.bind(ocrController));
// Validate receipt data
router.post('/validate', authenticateToken, ocrController.validateReceiptData.bind(ocrController));
export default router;
//# sourceMappingURL=ocr-new.js.map