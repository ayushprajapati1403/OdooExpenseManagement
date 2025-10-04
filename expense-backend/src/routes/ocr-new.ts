import express from 'express';
import { OCRController } from '../controllers/ocrController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const ocrController = new OCRController();

// Get OCR upload middleware
const upload = ocrController.getUploadMiddleware();

// Process receipt with OCR
router.post('/process-receipt', 
  authenticateToken, 
  upload.single('receipt'), 
  ocrController.processReceipt.bind(ocrController)
);

// Create expense from receipt
router.post('/create-expense', 
  authenticateToken, 
  upload.single('receipt'), 
  ocrController.createExpenseFromReceipt.bind(ocrController)
);

// Get supported formats
router.get('/formats', 
  authenticateToken, 
  ocrController.getSupportedFormats.bind(ocrController)
);

// Validate receipt data
router.post('/validate', 
  authenticateToken, 
  ocrController.validateReceiptData.bind(ocrController)
);

export default router;
