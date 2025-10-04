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
import { apiClient } from '@/lib/prisma';
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
  const [userRole, setUserRole] = React.useState<string>('');
  const [hasPermission, setHasPermission] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    checkPermissionsAndLoadApprovals();
  }, []);

  const checkPermissionsAndLoadApprovals = async () => {
    try {
      // First check user role
      const userProfile = await apiClient.getUserProfile();
      setUserRole(userProfile.role);
      
      // Only load approvals if user has permission (MANAGER or ADMIN)
      if (userProfile.role === 'MANAGER' || userProfile.role === 'ADMIN') {
        setHasPermission(true);
        await loadApprovals();
      } else {
        setHasPermission(false);
        console.warn('User does not have permission to view approvals:', userProfile.role);
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasPermission(false);
    }
  };

  const loadApprovals = async () => {
    try {
      const response = await apiClient.getPendingApprovals(1, 10, true); // includeAll = true
      console.log('📊 Loaded approvals:', response.approvals?.length || 0);
      response.approvals?.forEach(approval => {
        console.log(`  - ${approval.expense?.title}: ${approval.expense?.status} (approval: ${approval.status})`);
      });
      setApprovals(response.approvals || []);
    } catch (error) {
      console.error('Failed to load approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approvals',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: string, comment?: string) => {
    console.log('🚀 Approving expense:', id, comment);
    setIsProcessing(true);
    try {
      const result = await apiClient.approveExpense(id, comment);
      console.log('✅ Approval result:', result);
      toast({
        title: 'Expense Approved',
        description: 'The expense has been approved successfully.',
      });
      await loadApprovals(); // Reload approvals
      setSelectedApproval(null);
    } catch (error: any) {
      console.error('❌ Approval error:', error);
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
    console.log('🚫 Rejecting expense:', id, comment);
    setIsProcessing(true);
    try {
      const result = await apiClient.rejectExpense(id, comment);
      console.log('✅ Rejection result:', result);
      toast({
        title: 'Expense Rejected',
        description: 'The expense has been rejected.',
        variant: 'destructive',
      });
      await loadApprovals(); // Reload approvals
      setSelectedApproval(null);
    } catch (error: any) {
      console.error('❌ Rejection error:', error);
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject expense.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    const approval = approvals.find((a) => a.id === id);
    if (approval) {
      setSelectedApproval(approval);
      
      // Load approval history for this expense
      try {
        console.log('🔍 Loading approval history for expense:', approval.expenseId);
        const history = await apiClient.getApprovalHistory(approval.expenseId);
        console.log('📊 Approval history loaded:', history);
        setActions(history);
      } catch (error) {
        console.error('Failed to load approval history:', error);
        setActions([]);
      }
    }
  };

  const filteredApprovals = React.useMemo(() => {
    if (activeTab === 'all') return approvals;
    return approvals.filter((approval) => {
      // Filter by expense status, not approval request status
      if (activeTab === 'pending') {
        return approval.expense?.status === 'pending';
      } else if (activeTab === 'approved') {
        return approval.expense?.status === 'approved';
      } else if (activeTab === 'rejected') {
        return approval.expense?.status === 'rejected';
      }
      return false;
    });
  }, [approvals, activeTab]);

  const stats = React.useMemo(() => {
    return {
      pending: approvals.filter((a) => a.expense?.status === 'pending').length,
      approved: approvals.filter((a) => a.expense?.status === 'approved').length,
      rejected: approvals.filter((a) => a.expense?.status === 'rejected').length,
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

        {/* Permission Check */}
        {userRole && !hasPermission && (
          <div className="p-6 bg-accent/50 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <h3 className="font-medium text-orange-700">Access Restricted</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Approval management requires Manager or Admin role. Your current role: <span className="font-medium text-primary">{userRole}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {hasPermission ? (
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
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Approval Access Required</h3>
              <p className="text-muted-foreground mb-4">
                You need Manager or Admin privileges to view and manage expense approvals.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request approval permissions.
              </p>
            </div>
          </div>
        )}
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
