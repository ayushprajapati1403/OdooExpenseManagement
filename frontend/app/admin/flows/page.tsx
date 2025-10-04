'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GitBranch, CreditCard as Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
import type { ApprovalFlow, ApprovalFlowStep } from '@/types';

function ApprovalFlowsPage() {
  const [flows, setFlows] = React.useState<ApprovalFlow[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingFlow, setEditingFlow] = React.useState<ApprovalFlow | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
  });
  const [steps, setSteps] = React.useState<Partial<ApprovalFlowStep>[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const mockFlows: ApprovalFlow[] = [
      {
        id: '1',
        name: 'Standard Approval Flow',
        description: 'Default approval flow for all expenses',
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Executive Approval',
        description: 'High-value expense approval requiring executive sign-off',
        isActive: false,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setFlows(mockFlows);
  }, []);

  const handleCreateFlow = () => {
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

    const newFlow: ApprovalFlow = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      description: formData.description,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFlows((prev) => [...prev, newFlow]);
    toast({
      title: 'Success',
      description: 'Approval flow created successfully',
    });

    setShowForm(false);
    setFormData({ name: '', description: '' });
    setSteps([]);
  };

  const handleToggleActive = (id: string) => {
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

  const handleDeleteFlow = (id: string) => {
    setFlows((prev) => prev.filter((flow) => flow.id !== id));
    toast({
      title: 'Success',
      description: 'Flow deleted successfully',
    });
  };

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
                        <Button variant="ghost" size="sm">
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
              Create Approval Flow
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

            <FlowStepForm steps={steps} onChange={setSteps} />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', description: '' });
                  setSteps([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFlow} className="flex-1">
                Create Flow
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
