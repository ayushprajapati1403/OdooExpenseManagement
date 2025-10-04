import multer from 'multer';
import { config } from '../config/index.js';

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  items: ExtractedItem[];
  totalAmount?: number;
  currency?: string;
  date?: string;
  merchant?: string;
  rawData?: any;
}

export interface ExtractedItem {
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

export interface ReceiptData {
  totalAmount: number;
  currency: string;
  date: string;
  merchant: string;
  items: ExtractedItem[];
  tax?: number;
  tip?: number;
  subtotal?: number;
}

export class OCRService {
  private upload: multer.Multer;

  constructor() {
    // Configure multer for file uploads
    const storage = multer.memoryStorage();
    this.upload = multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
  }

  /**
   * Process receipt image and extract data
   */
  async processReceipt(imageBuffer: Buffer, filename: string): Promise<OCRResult> {
    try {
      // Simulate OCR processing (in real implementation, use services like Google Vision API, AWS Textract, etc.)
      const mockOCRResult = await this.simulateOCRProcessing(imageBuffer, filename);
      
      // Parse the extracted text to structured data
      const parsedData = this.parseReceiptText(mockOCRResult.text);
      
      return {
        success: true,
        text: mockOCRResult.text,
        confidence: mockOCRResult.confidence,
        items: parsedData.items,
        totalAmount: parsedData.totalAmount,
        currency: parsedData.currency,
        date: parsedData.date,
        merchant: parsedData.merchant,
        rawData: mockOCRResult
      };
    } catch (error) {
      console.error('Error processing receipt:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        items: [],
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Simulate OCR processing (replace with real OCR service)
   */
  private async simulateOCRProcessing(imageBuffer: Buffer, filename: string): Promise<{
    text: string;
    confidence: number;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock OCR results based on filename or random data
    const mockResults = [
      {
        text: `STARBUCKS COFFEE
123 Main Street
New York, NY 10001

Receipt #12345
Date: 2024-01-15
Time: 14:30

Grande Latte          $4.95
Croissant             $2.50
Tax                   $0.60
Total                $8.05

Thank you for your visit!`,
        confidence: 0.95
      },
      {
        text: `AMAZON.COM
Amazon.com, Inc.
410 Terry Ave N
Seattle, WA 98109

Order #123-4567890
Order Date: Jan 15, 2024

Wireless Mouse        $29.99
USB Cable             $12.50
Shipping              $5.99
Tax                   $3.84
Total                $52.32`,
        confidence: 0.92
      },
      {
        text: `UBER EATS
Receipt #UE7890123
Date: 2024-01-15

Restaurant: Pizza Palace
Delivery Fee          $2.99
Service Fee           $1.50
Tip                   $3.00
Tax                   $0.75
Total                $8.24`,
        confidence: 0.88
      }
    ];

    // Return random mock result
    const randomIndex = Math.floor(Math.random() * mockResults.length);
    return mockResults[randomIndex];
  }

  /**
   * Parse receipt text to extract structured data
   */
  private parseReceiptText(text: string): ReceiptData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let merchant = '';
    let date = '';
    let currency = 'USD';
    let totalAmount = 0;
    let items: ExtractedItem[] = [];
    let tax = 0;
    let tip = 0;
    let subtotal = 0;

    // Extract merchant name (usually first line)
    if (lines.length > 0) {
      merchant = lines[0];
    }

    // Extract date
    const dateRegex = /(?:date|Date):\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i;
    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        date = dateMatch[1];
        break;
      }
    }

    // Extract currency
    const currencyRegex = /\$|USD|EUR|GBP|JPY|CAD|AUD/;
    const currencyMatch = text.match(currencyRegex);
    if (currencyMatch) {
      if (currencyMatch[0] === '$') {
        currency = 'USD';
      } else {
        currency = currencyMatch[0];
      }
    }

    // Extract items and amounts
    for (const line of lines) {
      // Skip header lines
      if (line.includes('Receipt') || line.includes('Date') || line.includes('Time') || 
          line.includes('Order') || line.includes('Thank you')) {
        continue;
      }

      // Extract total amount
      if (line.toLowerCase().includes('total')) {
        const amountMatch = line.match(/\$?(\d+\.?\d*)/);
        if (amountMatch) {
          totalAmount = parseFloat(amountMatch[1]);
        }
        continue;
      }

      // Extract tax
      if (line.toLowerCase().includes('tax')) {
        const amountMatch = line.match(/\$?(\d+\.?\d*)/);
        if (amountMatch) {
          tax = parseFloat(amountMatch[1]);
        }
        continue;
      }

      // Extract tip
      if (line.toLowerCase().includes('tip')) {
        const amountMatch = line.match(/\$?(\d+\.?\d*)/);
        if (amountMatch) {
          tip = parseFloat(amountMatch[1]);
        }
        continue;
      }

      // Extract subtotal
      if (line.toLowerCase().includes('subtotal')) {
        const amountMatch = line.match(/\$?(\d+\.?\d*)/);
        if (amountMatch) {
          subtotal = parseFloat(amountMatch[1]);
        }
        continue;
      }

      // Extract items
      const itemMatch = line.match(/^(.+?)\s+\$?(\d+\.?\d*)$/);
      if (itemMatch) {
        const description = itemMatch[1].trim();
        const amount = parseFloat(itemMatch[2]);
        
        // Skip if it's a total, tax, tip, or subtotal line
        if (!description.toLowerCase().includes('total') && 
            !description.toLowerCase().includes('tax') && 
            !description.toLowerCase().includes('tip') && 
            !description.toLowerCase().includes('subtotal') &&
            !description.toLowerCase().includes('shipping') &&
            !description.toLowerCase().includes('delivery') &&
            !description.toLowerCase().includes('service')) {
          items.push({
            description,
            amount
          });
        }
      }
    }

    return {
      totalAmount,
      currency,
      date,
      merchant,
      items,
      tax,
      tip,
      subtotal
    };
  }

  /**
   * Validate extracted receipt data
   */
  validateReceiptData(data: ReceiptData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.push('Total amount is missing or invalid');
    }

    if (!data.currency || data.currency.length !== 3) {
      errors.push('Currency is missing or invalid');
    }

    if (!data.date) {
      errors.push('Date is missing');
    }

    if (!data.merchant || data.merchant.trim().length === 0) {
      errors.push('Merchant name is missing');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('No items found in receipt');
    }

    // Validate items
    data.items.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        errors.push(`Item ${index + 1}: Description is missing`);
      }
      if (!item.amount || item.amount <= 0) {
        errors.push(`Item ${index + 1}: Amount is missing or invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get multer middleware for file uploads
   */
  getUploadMiddleware() {
    return this.upload;
  }

  /**
   * Process multiple receipt images
   */
  async processMultipleReceipts(imageBuffers: Buffer[], filenames: string[]): Promise<OCRResult[]> {
    try {
      const results = await Promise.all(
        imageBuffers.map((buffer, index) => 
          this.processReceipt(buffer, filenames[index] || `receipt_${index}.jpg`)
        )
      );

      return results;
    } catch (error) {
      console.error('Error processing multiple receipts:', error);
      throw new Error('Failed to process multiple receipts');
    }
  }

  /**
   * Extract expense data from OCR result
   */
  extractExpenseData(ocrResult: OCRResult): {
    amount: number;
    currency: string;
    category: string;
    description: string;
    date: string;
    expenseLines: Array<{ amount: number; description: string }>;
  } {
    if (!ocrResult.success) {
      throw new Error('OCR processing failed');
    }

    const data = ocrResult.rawData as ReceiptData;
    
    // Determine category based on merchant
    const category = this.determineCategory(data.merchant);
    
    // Create expense lines from items
    const expenseLines = data.items.map(item => ({
      amount: item.amount,
      description: item.description
    }));

    return {
      amount: data.totalAmount,
      currency: data.currency,
      category,
      description: `Receipt from ${data.merchant}`,
      date: data.date,
      expenseLines
    };
  }

  /**
   * Determine expense category based on merchant name
   */
  private determineCategory(merchant: string): string {
    const merchantLower = merchant.toLowerCase();
    
    if (merchantLower.includes('starbucks') || merchantLower.includes('coffee') || 
        merchantLower.includes('restaurant') || merchantLower.includes('food')) {
      return 'Meals';
    }
    
    if (merchantLower.includes('uber') || merchantLower.includes('taxi') || 
        merchantLower.includes('transport') || merchantLower.includes('gas')) {
      return 'Transportation';
    }
    
    if (merchantLower.includes('hotel') || merchantLower.includes('airbnb') || 
        merchantLower.includes('accommodation')) {
      return 'Accommodation';
    }
    
    if (merchantLower.includes('amazon') || merchantLower.includes('store') || 
        merchantLower.includes('shop') || merchantLower.includes('retail')) {
      return 'Office Supplies';
    }
    
    if (merchantLower.includes('gas') || merchantLower.includes('fuel') || 
        merchantLower.includes('petrol')) {
      return 'Transportation';
    }
    
    if (merchantLower.includes('phone') || merchantLower.includes('internet') || 
        merchantLower.includes('utilities')) {
      return 'Utilities';
    }
    
    return 'Other';
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[] {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  }

  /**
   * Clean up temporary files (if any)
   */
  cleanup(): void {
    // Cleanup any temporary files if needed
    // This is a placeholder for cleanup operations
  }
}
