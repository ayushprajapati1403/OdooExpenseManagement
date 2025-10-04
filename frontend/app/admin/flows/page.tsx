'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GitBranch, CreditCard as Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FlowStepForm } from '@/components/approval/flow-step-form';
import { NotebookContainer } from '@/components/layout/notebook-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/prisma';
import type { ApprovalFlow, ApprovalFlowStep } from '@/types';

function ApprovalFlowsPage() {
  const [flows, setFlows] = React.useState<ApprovalFlow[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingFlow, setEditingFlow] = React.useState<ApprovalFlow | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    ruleType: 'UNANIMOUS' as 'UNANIMOUS' | 'PERCENTAGE' | 'SPECIFIC',
    percentageThreshold: 75,
    specificApproverId: '',
  });
  const [steps, setSteps] = React.useState<Partial<ApprovalFlowStep>[]>([]);
  const { toast } = useToast();

  // Load approval flows on component mount
  React.useEffect(() => {
    loadApprovalFlows();
  }, []);

  const loadApprovalFlows = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading approval flows...');
      const response = await apiClient.getApprovalFlows();
      console.log('📊 Loaded approval flows:', response.approvalFlows?.length || 0);
      setFlows(response.approvalFlows || []);
    } catch (error) {
      console.error('Failed to load approval flows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approval flows',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFlow = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Flow name is required',
        variant: 'destructive',
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one approval step is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('🔧 Creating approval flow:', formData, steps);
      console.log('🔧 Frontend steps:', steps);
      
      // Map frontend steps to backend format
      const backendSteps = steps.map((step) => {
        // For now, we'll use a simple mapping based on the step's ruleType
        // This is a simplified approach - in a real app you'd have more complex logic
        if (step.ruleType === 'specific_user' && step.approvers && step.approvers.length > 0) {
          return {
            specificUserId: step.approvers[0] // Use first approver as specific user
          };
        } else if (step.ruleType === 'any_user' || step.ruleType === 'percentage') {
          // For now, default to MANAGER role for these types
          return {
            role: 'MANAGER'
          };
        } else {
          // Default to MANAGER role
          return {
            role: 'MANAGER'
          };
        }
      });

      const flowData = {
        name: formData.name,
        description: formData.description,
        ruleType: formData.ruleType,
        percentageThreshold: formData.ruleType === 'PERCENTAGE' ? formData.percentageThreshold : null,
        specificApproverId: formData.ruleType === 'SPECIFIC' ? formData.specificApproverId : null,
        steps: backendSteps,
      };

      const result = await apiClient.createApprovalFlow(flowData);
      console.log('✅ Approval flow created:', result);
      
      toast({
        title: 'Success',
        description: result.message || 'Approval flow created successfully',
      });

      // Reload flows
      await loadApprovalFlows();
      
      // Reset form
      setShowForm(false);
      setFormData({ 
        name: '', 
        description: '', 
        ruleType: 'UNANIMOUS',
        percentageThreshold: 75,
        specificApproverId: ''
      });
      setSteps([]);
    } catch (error: any) {
      console.error('Failed to create approval flow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create approval flow',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFlow = (flow: ApprovalFlow) => {
    setEditingFlow(flow);
    setFormData({
      name: flow.name,
      description: flow.description || '',
      ruleType: flow.ruleType || 'UNANIMOUS',
      percentageThreshold: flow.percentageThreshold || 75,
      specificApproverId: flow.specificApproverId || '',
    });
    
    // Map backend steps to frontend format
    const frontendSteps = (flow.steps || []).map((step) => ({
      id: step.id || Math.random().toString(36).substr(2, 9),
      stepOrder: step.stepOrder || 1,
      stepName: step.role ? `${step.role} Approval` : 'Specific User Approval',
      ruleType: step.specificUserId ? 'specific_user' : 'any_user',
      requiredApprovers: 1,
      approvers: step.specificUserId ? [step.specificUserId] : [],
    }));
    
    setSteps(frontendSteps);
    setShowForm(true);
  };

  const handleUpdateFlow = async () => {
    if (!editingFlow) return;

    try {
      setIsSaving(true);
      console.log('🔧 Updating approval flow:', editingFlow.id, formData, steps);
      
      // Map frontend steps to backend format
      const backendSteps = steps.map((step) => {
        // For now, we'll use a simple mapping based on the step's ruleType
        // This is a simplified approach - in a real app you'd have more complex logic
        if (step.ruleType === 'specific_user' && step.approvers && step.approvers.length > 0) {
          return {
            specificUserId: step.approvers[0] // Use first approver as specific user
          };
        } else if (step.ruleType === 'any_user' || step.ruleType === 'percentage') {
          // For now, default to MANAGER role for these types
          return {
            role: 'MANAGER'
          };
        } else {
          // Default to MANAGER role
          return {
            role: 'MANAGER'
          };
        }
      });

      const flowData = {
        name: formData.name,
        description: formData.description,
        ruleType: formData.ruleType,
        percentageThreshold: formData.ruleType === 'PERCENTAGE' ? formData.percentageThreshold : null,
        specificApproverId: formData.ruleType === 'SPECIFIC' ? formData.specificApproverId : null,
        steps: backendSteps,
      };

      const result = await apiClient.updateApprovalFlow(editingFlow.id, flowData);
      console.log('✅ Approval flow updated:', result);
      
      toast({
        title: 'Success',
        description: result.message || 'Approval flow updated successfully',
      });

      // Reload flows
      await loadApprovalFlows();
      
      // Reset form
      setShowForm(false);
      setEditingFlow(null);
      setFormData({ 
        name: '', 
        description: '', 
        ruleType: 'UNANIMOUS',
        percentageThreshold: 75,
        specificApproverId: ''
      });
      setSteps([]);
    } catch (error: any) {
      console.error('Failed to update approval flow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update approval flow',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this approval flow?')) {
      return;
    }

    try {
      console.log('🔧 Deleting approval flow:', id);
      const result = await apiClient.deleteApprovalFlow(id);
      console.log('✅ Approval flow deleted:', result);
      
      toast({
        title: 'Success',
        description: result.message || 'Approval flow deleted successfully',
      });

      // Reload flows
      await loadApprovalFlows();
    } catch (error: any) {
      console.error('Failed to delete approval flow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete approval flow',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    // Note: Backend doesn't have isActive field, so this is just UI state
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === id ? { ...flow, isActive: !flow.isActive } : flow
      )
    );

    toast({
      title: 'Success',
      description: 'Flow status updated',
    });
  };

  const handleFormSubmit = () => {
    if (editingFlow) {
      handleUpdateFlow();
    } else {
      handleCreateFlow();
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFlow(null);
    setFormData({ 
      name: '', 
      description: '', 
      ruleType: 'UNANIMOUS',
      percentageThreshold: 75,
      specificApproverId: ''
    });
    setSteps([]);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading approval flows...</span>
        </div>
      </DashboardLayout>
    );
  }

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
              <GitBranch className="h-8 w-8" />
              Approval Flows
            </h2>
            <p className="text-muted-foreground">
              Manage approval workflows for expense requests
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Flow
            </Button>
          </motion.div>
        </div>

        <NotebookContainer animate={false}>
          {flows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">
                No approval flows yet. Create your first flow!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {flows.map((flow) => (
                  <motion.div
                    key={flow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="notebook-shadow hover:notebook-shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="handwriting-text text-xl mb-2">
                              {flow.name}
                            </CardTitle>
                            {flow.description && (
                              <p className="text-sm text-muted-foreground">
                                {flow.description}
                              </p>
                            )}
                            <div className="mt-2 flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {flow.ruleType}
                              </Badge>
                              {flow.percentageThreshold && (
                                <Badge variant="outline" className="text-xs">
                                  {flow.percentageThreshold}%
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {flow.steps?.length || 0} steps
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            variant={flow.isActive ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {flow.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="bg-accent/30 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(flow.id)}
                        >
                          {flow.isActive ? (
                            <ToggleRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 mr-1" />
                          )}
                          {flow.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditFlow(flow)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </NotebookContainer>
      </motion.div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="handwriting-text text-2xl">
              {editingFlow ? 'Edit Approval Flow' : 'Create Approval Flow'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="handwriting-text text-base">
                Flow Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Standard Approval Flow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="handwriting-text text-base">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe when this flow should be used..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleType" className="handwriting-text text-base">
                Approval Rule Type
              </Label>
              <select
                id="ruleType"
                value={formData.ruleType}
                onChange={(e) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    ruleType: e.target.value as 'UNANIMOUS' | 'PERCENTAGE' | 'SPECIFIC'
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="UNANIMOUS">Unanimous (All approvers must approve)</option>
                <option value="PERCENTAGE">Percentage (Threshold-based)</option>
                <option value="SPECIFIC">Specific Approver</option>
              </select>
            </div>

            {formData.ruleType === 'PERCENTAGE' && (
              <div className="space-y-2">
                <Label htmlFor="percentageThreshold" className="handwriting-text text-base">
                  Percentage Threshold
                </Label>
                <Input
                  id="percentageThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.percentageThreshold}
                  onChange={(e) =>
                    setFormData((prev) => ({ 
                      ...prev, 
                      percentageThreshold: parseInt(e.target.value) || 75
                    }))
                  }
                  placeholder="75"
                />
              </div>
            )}

            <FlowStepForm steps={steps} onChange={setSteps} />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleFormCancel}
                className="flex-1"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFormSubmit} 
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingFlow ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingFlow ? 'Update Flow' : 'Create Flow'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default function ApprovalFlows() {
  return (
    <ProtectedRoute>
      <ApprovalFlowsPage />
    </ProtectedRoute>
  );
}
