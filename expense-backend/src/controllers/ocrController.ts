import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { OCRService } from '../services/ocrService.js';

export class OCRController {
  private ocrService: OCRService;

  constructor() {
    this.ocrService = new OCRService();
  }

  async processReceipt(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Receipt image is required' });
      }

      const { category, description, date } = req.body;

      // Process receipt with OCR service
      const ocrResult = await this.ocrService.processReceipt(req.file.buffer, req.file.originalname);

      if (!ocrResult.success) {
        return res.status(400).json({ 
          error: 'Failed to process receipt',
          details: ocrResult.rawData?.error || 'OCR processing failed'
        });
      }

      // Validate extracted data
      const receiptData = ocrResult.rawData as any;
      const validation = this.ocrService.validateReceiptData(receiptData);

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid receipt data',
          details: validation.errors
        });
      }

      // Extract expense data
      const expenseData = this.ocrService.extractExpenseData(ocrResult);

      res.json({
        message: 'Receipt processed successfully',
        ocrResult: {
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          extractedData: {
            merchant: receiptData.merchant,
            totalAmount: receiptData.totalAmount,
            currency: receiptData.currency,
            date: receiptData.date,
            items: receiptData.items
          },
          expenseData: {
            amount: expenseData.amount,
            currency: expenseData.currency,
            category: expenseData.category,
            description: expenseData.description,
            date: expenseData.date,
            expenseLines: expenseData.expenseLines
          }
        }
      });
    } catch (error) {
      console.error('Process receipt error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createExpenseFromReceipt(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Receipt image is required' });
      }

      const { category, description, date } = req.body;

      // Process receipt with OCR service
      const ocrResult = await this.ocrService.processReceipt(req.file.buffer, req.file.originalname);

      if (!ocrResult.success) {
        return res.status(400).json({ 
          error: 'Failed to process receipt',
          details: ocrResult.rawData?.error || 'OCR processing failed'
        });
      }

      // Extract expense data
      const expenseData = this.ocrService.extractExpenseData(ocrResult);

      // Get user's company
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { company: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          companyId: user.companyId,
          userId: req.user!.userId,
          amount: expenseData.amount,
          currency: expenseData.currency,
          amountInCompanyCurrency: expenseData.currency === user.company.currency 
            ? expenseData.amount 
            : null, // Will be converted by currency service
          category: category || expenseData.category,
          description: description || expenseData.description,
          date: new Date(date || expenseData.date),
          receiptImageUrl: `/uploads/${req.file.filename}`,
          ocrData: ocrResult.rawData
        }
      });

      // Create expense lines
      if (expenseData.expenseLines && expenseData.expenseLines.length > 0) {
        await prisma.expenseLine.createMany({
          data: expenseData.expenseLines.map((line: any) => ({
            expenseId: expense.id,
            amount: line.amount,
            description: line.description
          }))
        });
      }

      res.status(201).json({
        message: 'Expense created from receipt successfully',
        expense: {
          id: expense.id,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          status: expense.status,
          receiptImageUrl: expense.receiptImageUrl
        },
        ocrData: {
          confidence: ocrResult.confidence,
          extractedText: ocrResult.text,
          merchant: expenseData.description.split(' from ')[1] || 'Unknown'
        }
      });
    } catch (error) {
      console.error('Create expense from receipt error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSupportedFormats(req: AuthenticatedRequest, res: Response) {
    try {
      const formats = this.ocrService.getSupportedFormats();
      const maxFileSize = this.ocrService.getMaxFileSize();

      res.json({
        supportedFormats: formats,
        maxFileSize,
        maxFileSizeMB: Math.round(maxFileSize / (1024 * 1024))
      });
    } catch (error) {
      console.error('Get supported formats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validateReceiptData(req: AuthenticatedRequest, res: Response) {
    try {
      const receiptData = req.body;

      const validation = this.ocrService.validateReceiptData(receiptData);

      res.json({
        isValid: validation.isValid,
        errors: validation.errors,
        validatedData: validation.isValid ? receiptData : null
      });
    } catch (error) {
      console.error('Validate receipt data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUploadMiddleware() {
    return this.ocrService.getUploadMiddleware();
  }
}
