'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/supabase';

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

interface QuickActionsProps {
  onAddExpense: () => void;
}

export function QuickActions({ onAddExpense }: QuickActionsProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadReceipt = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPG, PNG, or PDF file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Processing Receipt',
        description: 'Uploading and processing your receipt...',
      });

      const response = await apiClient.createExpenseFromReceipt(file);
      
      toast({
        title: 'Success!',
        description: 'Expense created from receipt successfully!',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Optionally refresh the page or trigger a callback to update the expense list
      window.location.reload();
      
    } catch (error) {
      console.error('Receipt processing error:', error);
      toast({
        title: 'Processing Failed',
        description: 'Failed to process receipt. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewReports = () => {
    toast({
      title: 'View Reports',
      description: 'Reports feature coming soon!',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Export Data',
      description: 'Data export feature coming soon!',
    });
  };

  const actions: QuickAction[] = [
    {
      title: 'Add Expense',
      icon: <Plus className="h-5 w-5" />,
      onClick: onAddExpense,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Upload Receipt',
      icon: <Upload className="h-5 w-5" />,
      onClick: handleUploadReceipt,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'View Reports',
      icon: <FileText className="h-5 w-5" />,
      onClick: handleViewReports,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'Export Data',
      icon: <Download className="h-5 w-5" />,
      onClick: handleExportData,
      color: 'bg-red-500 hover:bg-red-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Hidden file input for receipt upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <Card className="notebook-shadow">
        <CardHeader>
          <CardTitle className="handwriting-text text-2xl">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={action.onClick}
                  className={`w-full h-auto flex flex-col items-center gap-2 p-4 ${action.color} text-white`}
                >
                  {action.icon}
                  <span className="text-sm font-medium">{action.title}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
