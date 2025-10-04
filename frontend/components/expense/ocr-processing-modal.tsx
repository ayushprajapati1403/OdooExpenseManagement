'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/prisma';

interface OCRProcessingModalProps {
  open: boolean;
  onClose: () => void;
  onExpenseCreated: () => void;
}

interface OCRData {
  totalAmount: number;
  currency: string;
  merchant: string;
  date: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  confidence: number;
}

export function OCRProcessingModal({ open, onClose, onExpenseCreated }: OCRProcessingModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [ocrData, setOcrData] = React.useState<OCRData | null>(null);
  const [expenseData, setExpenseData] = React.useState({
    amount: '',
    currency: 'USD',
    category: 'Meals',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPG or PNG image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    processReceipt(selectedFile);
  };

  const processReceipt = async (file: File) => {
    try {
      setIsProcessing(true);
      toast({
        title: 'Processing Receipt',
        description: 'Extracting data from your receipt...',
      });

      const response = await apiClient.processReceipt(file);
      
      if (response.ocrData) {
        setOcrData(response.ocrData);
        
        // Pre-fill form with OCR data
        setExpenseData({
          amount: response.ocrData.totalAmount.toString(),
          currency: response.ocrData.currency,
          category: 'Meals', // Default category
          description: response.ocrData.merchant || '',
          date: response.ocrData.date || new Date().toISOString().split('T')[0],
        });

        toast({
          title: 'Receipt Processed!',
          description: `Extracted data with ${Math.round(response.ocrData.confidence * 100)}% confidence`,
        });
      }
    } catch (error: any) {
      console.error('OCR processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitExpense = async () => {
    if (!expenseData.amount || !expenseData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const expensePayload = {
        amount: parseFloat(expenseData.amount),
        currency: expenseData.currency,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        expenseLines: ocrData?.items.map(item => ({
          amount: item.amount,
          description: item.description,
        })) || [],
      };

      const result = await apiClient.createExpense(expensePayload);
      
      toast({
        title: 'Success!',
        description: 'Expense created successfully from receipt!',
      });

      onExpenseCreated();
      handleClose();
    } catch (error: any) {
      console.error('Expense creation error:', error);
      toast({
        title: 'Failed to Create Expense',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setOcrData(null);
    setExpenseData({
      amount: '',
      currency: 'USD',
      category: 'Meals',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="handwriting-text text-2xl flex items-center gap-2">
                  <Upload className="h-6 w-6" />
                  Upload Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      disabled={isProcessing}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {file ? 'Change File' : 'Select Receipt Image'}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supported formats: JPG, PNG (max 10MB)
                    </p>
                  </div>

                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Processing Status */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Processing receipt...
                    </span>
                  </motion.div>
                )}

                {/* OCR Results */}
                {ocrData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Data Extracted Successfully</span>
                      <Badge variant="outline" className="ml-auto">
                        {Math.round(ocrData.confidence * 100)}% confidence
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Merchant</Label>
                        <p className="font-medium">{ocrData.merchant}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Amount</Label>
                        <p className="font-medium">{ocrData.currency} {ocrData.totalAmount}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <p className="font-medium">{ocrData.date}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Items</Label>
                        <p className="font-medium">{ocrData.items.length} items</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Expense Form */}
                {ocrData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-lg">Review & Submit Expense</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={expenseData.amount}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={expenseData.currency}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, currency: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={expenseData.description}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter expense description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={expenseData.category}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="Meals">Meals</option>
                          <option value="Transport">Transport</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Health">Health</option>
                          <option value="Education">Education</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={expenseData.date}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  {ocrData && (
                    <Button
                      onClick={handleSubmitExpense}
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Expense'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
