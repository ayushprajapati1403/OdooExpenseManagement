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
import { apiClient } from '@/lib/supabase';
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
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const response = await apiClient.getPendingApprovals();
      setApprovals(response.approvals || []);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    }
  };

  const handleApprove = async (id: string, comment?: string) => {
    setIsProcessing(true);
    try {
      await apiClient.approveExpense(id, comment);
      toast({
        title: 'Expense Approved',
        description: 'The expense has been approved successfully.',
      });
      await loadApprovals(); // Reload approvals
      setSelectedApproval(null);
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve expense.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string, comment?: string) => {
    setIsProcessing(true);
    try {
      await apiClient.rejectExpense(id, comment);
      toast({
        title: 'Expense Rejected',
        description: 'The expense has been rejected.',
        variant: 'destructive',
      });
      await loadApprovals(); // Reload approvals
      setSelectedApproval(null);
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject expense.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
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
