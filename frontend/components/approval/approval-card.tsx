'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, DollarSign, Calendar, User, FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ApprovalRequest } from '@/types';

interface ApprovalCardProps {
  approval: ApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (id: string) => void;
  isProcessing?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Rejected',
  },
};

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onViewDetails,
  isProcessing,
}: ApprovalCardProps) {
  const expense = approval.expense;
  
  // Debug logging
  console.log('🔍 ApprovalCard data:', {
    approvalId: approval.id,
    approvalStatus: approval.status,
    expenseTitle: expense?.title,
    expenseDescription: expense?.description,
    expenseAmount: expense?.amount,
    expenseCategory: expense?.category,
    expenseDate: expense?.date,
    userName: expense?.user?.name,
    userEmail: expense?.user?.email
  });
  
  // Ensure status exists in config, fallback to pending
  const safeStatus = approval.status in statusConfig ? approval.status : 'pending';
  const status = statusConfig[safeStatus];
  const StatusIcon = status.icon;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="notebook-shadow hover:notebook-shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {expense?.user?.name ? getInitials(expense.user.name) : 'UN'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 handwriting-text truncate">
                  {expense?.title || 'Expense Request'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{expense?.user?.name || 'Unknown User'}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className={cn('gap-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-bold">
                  {expense?.currency || 'USD'} ${expense?.amount.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-bold">
                  {expense?.date ? format(new Date(expense.date), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {expense?.description && (
            <div className="mb-4 p-3 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Description</p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {expense.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Category:</span>
            <Badge variant="outline" className="capitalize">
              {expense?.category || 'other'}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="bg-accent/30 p-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(approval.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          {approval.status === 'pending' && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(approval.id)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => onApprove(approval.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </motion.div>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
