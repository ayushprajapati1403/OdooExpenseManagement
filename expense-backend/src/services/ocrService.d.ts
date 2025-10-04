import multer from 'multer';
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
export declare class OCRService {
    private upload;
    constructor();
    /**
     * Process receipt image and extract data
     */
    processReceipt(imageBuffer: Buffer, filename: string): Promise<OCRResult>;
    /**
     * Simulate OCR processing (replace with real OCR service)
     */
    private simulateOCRProcessing;
    /**
     * Parse receipt text to extract structured data
     */
    private parseReceiptText;
    /**
     * Validate extracted receipt data
     */
    validateReceiptData(data: ReceiptData): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get multer middleware for file uploads
     */
    getUploadMiddleware(): multer.Multer;
    /**
     * Process multiple receipt images
     */
    processMultipleReceipts(imageBuffers: Buffer[], filenames: string[]): Promise<OCRResult[]>;
    /**
     * Extract expense data from OCR result
     */
    extractExpenseData(ocrResult: OCRResult): {
        amount: number;
        currency: string;
        category: string;
        description: string;
        date: string;
        expenseLines: Array<{
            amount: number;
            description: string;
        }>;
    };
    /**
     * Determine expense category based on merchant name
     */
    private determineCategory;
    /**
     * Get supported image formats
     */
    getSupportedFormats(): string[];
    /**
     * Get maximum file size
     */
    getMaxFileSize(): number;
    /**
     * Clean up temporary files (if any)
     */
    cleanup(): void;
}
//# sourceMappingURL=ocrService.d.ts.map