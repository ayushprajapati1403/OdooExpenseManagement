'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareCheck as CheckSquare, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ApprovalCard } from '@/components/approval/approval-card';
import { ApprovalDetailModal } from '@/components/approval/approval-detail-modal';
import { NotebookContainer } from '@/components/layout/notebook-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type {
  ApprovalRequest,
  ApprovalActionRecord,
  Expense,
  ApprovalRequestStatus,
} from '@/types';

function ApprovalsPage() {
  const [approvals, setApprovals] = React.useState<ApprovalRequest[]>([]);
  const [selectedApproval, setSelectedApproval] = React.useState<ApprovalRequest | null>(
    null
  );
  const [actions, setActions] = React.useState<ApprovalActionRecord[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ApprovalRequestStatus | 'all'>('pending');
  const { toast } = useToast();

  React.useEffect(() => {
    const mockExpense: Expense = {
      id: '1',
      title: 'Team Lunch at Cafe Rouge',
      amount: 250.0,
      currency: 'USD' as const,
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      description: 'Monthly team building lunch with the engineering team',
      status: 'pending',
      lineItems: [
        {
          id: '1',
          description: 'Main courses',
          amount: 180.0,
          category: 'food',
        },
        {
          id: '2',
          description: 'Beverages',
          amount: 70.0,
          category: 'food',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockApprovals: ApprovalRequest[] = [
      {
        id: '1',
        expenseId: '1',
        flowId: 'flow-1',
        currentStep: 1,
        status: 'pending',
        expense: mockExpense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        expenseId: '2',
        flowId: 'flow-1',
        currentStep: 2,
        status: 'pending',
        expense: {
          ...mockExpense,
          id: '2',
          title: 'Office Supplies Purchase',
          amount: 150.0,
          category: 'shopping',
          description: 'Printer paper, pens, and notebooks for the team',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        expenseId: '3',
        flowId: 'flow-1',
        currentStep: 3,
        status: 'approved',
        expense: {
          ...mockExpense,
          id: '3',
          title: 'Conference Registration',
          amount: 500.0,
          category: 'education',
          description: 'Annual tech conference registration fee',
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    setApprovals(mockApprovals);
  }, []);

  const handleApprove = async (id: string, comment?: string) => {
    setIsProcessing(true);

    setTimeout(() => {
      const newAction: ApprovalActionRecord = {
        id: Math.random().toString(36).substr(2, 9),
        requestId: id,
        stepId: 'step-1',
        approverId: 'user-1',
        action: 'approved',
        comment: comment || '',
        approverName: 'Current User',
        stepName: 'Manager Approval',
        createdAt: new Date().toISOString(),
      };

      setActions((prev) => [...prev, newAction]);
      setApprovals((prev) =>
        prev.map((approval) =>
          approval.id === id ? { ...approval, status: 'approved' as const } : approval
        )
      );

      toast({
        title: 'Expense Approved',
        description: 'The expense has been approved successfully.',
      });

      setSelectedApproval(null);
      setIsProcessing(false);
    }, 1000);
  };

  const handleReject = async (id: string, comment?: string) => {
    setIsProcessing(true);

    setTimeout(() => {
      const newAction: ApprovalActionRecord = {
        id: Math.random().toString(36).substr(2, 9),
        requestId: id,
        stepId: 'step-1',
        approverId: 'user-1',
        action: 'rejected',
        comment: comment || '',
        approverName: 'Current User',
        stepName: 'Manager Approval',
        createdAt: new Date().toISOString(),
      };

      setActions((prev) => [...prev, newAction]);
      setApprovals((prev) =>
        prev.map((approval) =>
          approval.id === id ? { ...approval, status: 'rejected' as const } : approval
        )
      );

      toast({
        title: 'Expense Rejected',
        description: 'The expense has been rejected.',
        variant: 'destructive',
      });

      setSelectedApproval(null);
      setIsProcessing(false);
    }, 1000);
  };

  const handleViewDetails = (id: string) => {
    const approval = approvals.find((a) => a.id === id);
    if (approval) {
      setSelectedApproval(approval);
    }
  };

  const filteredApprovals = React.useMemo(() => {
    if (activeTab === 'all') return approvals;
    return approvals.filter((approval) => approval.status === activeTab);
  }, [approvals, activeTab]);

  const stats = React.useMemo(() => {
    return {
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
    };
  }, [approvals]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 handwriting-text flex items-center gap-2">
              <CheckSquare className="h-8 w-8" />
              Pending Approvals
            </h2>
            <p className="text-muted-foreground">
              Review and approve expense requests
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">
              All ({approvals.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <NotebookContainer animate={false}>
              {filteredApprovals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <p className="text-muted-foreground text-lg">
                    No {activeTab !== 'all' && activeTab} approvals found
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredApprovals.map((approval) => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        onApprove={(id) => handleApprove(id)}
                        onReject={(id) => handleReject(id)}
                        onViewDetails={handleViewDetails}
                        isProcessing={isProcessing}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </NotebookContainer>
          </TabsContent>
        </Tabs>
      </motion.div>

      <ApprovalDetailModal
        open={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        approval={selectedApproval}
        actions={actions.filter((a) => a.requestId === selectedApproval?.id)}
        onApprove={(comment) => selectedApproval && handleApprove(selectedApproval.id, comment)}
        onReject={(comment) => selectedApproval && handleReject(selectedApproval.id, comment)}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
}

export default function Approvals() {
  return (
    <ProtectedRoute>
      <ApprovalsPage />
    </ProtectedRoute>
  );
}
