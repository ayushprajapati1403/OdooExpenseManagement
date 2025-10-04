import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
const router = express.Router();
const prisma = new PrismaClient();
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
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
router.post('/process-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Receipt image is required' });
        }
        const { category, description, date } = req.body;
        // In a real implementation, you would integrate with an OCR service like:
        // - Google Vision API
        // - AWS Textract
        // - Azure Computer Vision
        // - Tesseract.js (open source)
        // For now, we'll simulate OCR processing
        const mockOcrData = {
            totalAmount: 45.67,
            currency: 'USD',
            date: new Date().toISOString().split('T')[0],
            merchant: 'Sample Restaurant',
            items: [
                { description: 'Lunch', amount: 25.50 },
                { description: 'Drink', amount: 8.25 },
                { description: 'Tax', amount: 2.67 },
                { description: 'Tip', amount: 9.25 }
            ],
            confidence: 0.95
        };
        // Get user's company for currency conversion
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { company: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Convert amount to company currency if different
        let amountInCompanyCurrency = mockOcrData.totalAmount;
        if (mockOcrData.currency !== user.company.currency) {
            try {
                const conversionResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${mockOcrData.currency}`);
                const conversionData = await conversionResponse.json();
                const rate = conversionData.rates[user.company.currency];
                amountInCompanyCurrency = mockOcrData.totalAmount * rate;
            }
            catch (error) {
                console.error('Currency conversion error:', error);
            }
        }
        // Create expense with OCR data
        const expense = await prisma.expense.create({
            data: {
                companyId: user.companyId,
                userId: req.user.userId,
                amount: mockOcrData.totalAmount,
                currency: mockOcrData.currency,
                amountInCompanyCurrency,
                category: category || 'Meals',
                description: description || `${mockOcrData.merchant} - ${mockOcrData.date}`,
                date: new Date(date || mockOcrData.date),
                receiptImageUrl: req.file.path,
                ocrData: mockOcrData
            }
        });
        // Create expense lines from OCR data
        if (mockOcrData.items && mockOcrData.items.length > 0) {
            await prisma.expenseLine.createMany({
                data: mockOcrData.items.map((item) => ({
                    expenseId: expense.id,
                    amount: item.amount,
                    description: item.description
                }))
            });
        }
        res.status(201).json({
            message: 'Receipt processed successfully',
            expense: {
                id: expense.id,
                amount: expense.amount,
                currency: expense.currency,
                amountInCompanyCurrency: expense.amountInCompanyCurrency,
                category: expense.category,
                description: expense.description,
                date: expense.date,
                status: expense.status,
                receiptImageUrl: expense.receiptImageUrl
            },
            ocrData: mockOcrData
        });
    }
    catch (error) {
        console.error('Process receipt error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get OCR data for expense
router.get('/expense/:expenseId/ocr', authenticateToken, async (req, res) => {
    try {
        const { expenseId } = req.params;
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: {
                expenseLines: true
            }
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        // Check if user can view this expense
        if (expense.userId !== req.user.userId && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({
            ocrData: expense.ocrData,
            expenseLines: expense.expenseLines,
            receiptImageUrl: expense.receiptImageUrl
        });
    }
    catch (error) {
        console.error('Get OCR data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update OCR data for expense
router.put('/expense/:expenseId/ocr', authenticateToken, async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { ocrData, expenseLines } = req.body;
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId }
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        // Check if user can update this expense
        if (expense.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Check if expense is still pending
        if (expense.status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot update processed expense' });
        }
        // Update OCR data
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                ocrData: ocrData || undefined
            }
        });
        // Update expense lines if provided
        if (expenseLines) {
            // Delete existing lines
            await prisma.expenseLine.deleteMany({
                where: { expenseId }
            });
            // Create new lines
            if (expenseLines.length > 0) {
                await prisma.expenseLine.createMany({
                    data: expenseLines.map((line) => ({
                        expenseId,
                        amount: parseFloat(line.amount),
                        description: line.description
                    }))
                });
            }
        }
        res.json({
            message: 'OCR data updated successfully',
            expense: updatedExpense
        });
    }
    catch (error) {
        console.error('Update OCR data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Validate OCR data
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        const { ocrData } = req.body;
        if (!ocrData) {
            return res.status(400).json({ error: 'OCR data is required' });
        }
        // Basic validation
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };
        // Check required fields
        if (!ocrData.totalAmount || ocrData.totalAmount <= 0) {
            validation.isValid = false;
            validation.errors.push('Invalid total amount');
        }
        if (!ocrData.currency) {
            validation.isValid = false;
            validation.errors.push('Currency is required');
        }
        if (!ocrData.date) {
            validation.isValid = false;
            validation.errors.push('Date is required');
        }
        // Check date validity
        if (ocrData.date) {
            const expenseDate = new Date(ocrData.date);
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            if (expenseDate > today) {
                validation.warnings.push('Expense date is in the future');
            }
            if (expenseDate < thirtyDaysAgo) {
                validation.warnings.push('Expense date is more than 30 days old');
            }
        }
        // Check items
        if (ocrData.items && ocrData.items.length > 0) {
            const itemsTotal = ocrData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
            const difference = Math.abs(itemsTotal - ocrData.totalAmount);
            if (difference > 0.01) { // Allow for small rounding differences
                validation.warnings.push(`Items total (${itemsTotal}) doesn't match total amount (${ocrData.totalAmount})`);
            }
        }
        res.json({ validation });
    }
    catch (error) {
        console.error('Validate OCR data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=ocr.js.map