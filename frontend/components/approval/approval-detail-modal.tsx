'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  User,
  Building,
  MapPin,
  Receipt,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ApprovalTimeline } from './approval-timeline';
import { ApprovalActionForm } from './approval-action-form';
import type { ApprovalRequest, ApprovalActionRecord } from '@/types';

interface ApprovalDetailModalProps {
  open: boolean;
  onClose: () => void;
  approval: ApprovalRequest | null;
  actions: ApprovalActionRecord[];
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  isProcessing?: boolean;
}

export function ApprovalDetailModal({
  open,
  onClose,
  approval,
  actions,
  onApprove,
  onReject,
  isProcessing,
}: ApprovalDetailModalProps) {
  if (!approval || !approval.expense) return null;

  const expense = approval.expense;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="handwriting-text text-3xl">
            Expense Approval Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/30 rounded-lg p-6 space-y-4"
            >
              <h3 className="font-bold text-xl handwriting-text mb-4">
                {expense.title}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg">
                      {expense.currency} ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-bold">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge variant="secondary" className="capitalize">
                    {expense.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Submitted by:</span>
                  <span className="font-medium">John Doe</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <span className="font-medium">Engineering</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <span className="font-medium">San Francisco, CA</span>
                </div>
              </div>

              {expense.description && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Description</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {expense.description}
                    </p>
                  </div>
                </>
              )}

              {expense.lineItems && expense.lineItems.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3">Line Items</p>
                    <div className="space-y-2">
                      {expense.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 bg-background/50 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.category}
                            </p>
                          </div>
                          <p className="font-bold">${item.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {expense.receiptUrl && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Receipt</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Receipt
                    </Button>
                  </div>
                </>
              )}
            </motion.div>

            {approval.status === 'pending' && (
              <ApprovalActionForm
                onApprove={onApprove}
                onReject={onReject}
                isProcessing={isProcessing}
              />
            )}
          </div>

          <div>
            <ApprovalTimeline
              actions={actions}
              currentStep={approval.currentStep}
              totalSteps={3}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
