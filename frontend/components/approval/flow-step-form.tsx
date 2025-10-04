'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { ApprovalFlowStep, ApprovalRuleType } from '@/types';

interface FlowStepFormProps {
  steps: Partial<ApprovalFlowStep>[];
  onChange: (steps: Partial<ApprovalFlowStep>[]) => void;
}

const ruleTypes: { value: ApprovalRuleType; label: string; description: string }[] = [
  {
    value: 'specific_user',
    label: 'Specific User',
    description: 'Approval required from specific users',
  },
  {
    value: 'any_user',
    label: 'Any User',
    description: 'Approval from any user in the list',
  },
  {
    value: 'percentage',
    label: 'Percentage',
    description: 'Approval from a percentage of users',
  },
  {
    value: 'auto_approve',
    label: 'Auto Approve',
    description: 'Automatically approve at this step',
  },
];

export function FlowStepForm({ steps, onChange }: FlowStepFormProps) {
  const addStep = () => {
    const newStep: Partial<ApprovalFlowStep> = {
      id: Math.random().toString(36).substr(2, 9),
      stepOrder: steps.length + 1,
      stepName: '',
      ruleType: 'specific_user',
      requiredApprovers: 1,
      approvers: [],
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(
      newSteps.map((step, i) => ({
        ...step,
        stepOrder: i + 1,
      }))
    );
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    onChange(
      newSteps.map((step, i) => ({
        ...step,
        stepOrder: i + 1,
      }))
    );
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    onChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="handwriting-text text-lg">Approval Steps</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1" />
          Add Step
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="notebook-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center handwriting-text">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold">Step {index + 1}</h4>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`step-name-${index}`}>Step Name</Label>
                    <Input
                      id={`step-name-${index}`}
                      value={step.stepName}
                      onChange={(e) => updateStep(index, 'stepName', e.target.value)}
                      placeholder="e.g., Manager Approval"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`rule-type-${index}`}>Rule Type</Label>
                    <Select
                      value={step.ruleType}
                      onValueChange={(value) => updateStep(index, 'ruleType', value)}
                    >
                      <SelectTrigger id={`rule-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {step.ruleType === 'percentage' && (
                    <div className="space-y-2">
                      <Label htmlFor={`threshold-${index}`}>Threshold (%)</Label>
                      <Input
                        id={`threshold-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        value={step.thresholdPercentage || 50}
                        onChange={(e) =>
                          updateStep(
                            index,
                            'thresholdPercentage',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  )}

                  {step.ruleType !== 'auto_approve' && (
                    <div className="space-y-2">
                      <Label htmlFor={`required-${index}`}>Required Approvers</Label>
                      <Input
                        id={`required-${index}`}
                        type="number"
                        min="1"
                        value={step.requiredApprovers}
                        onChange={(e) =>
                          updateStep(index, 'requiredApprovers', parseInt(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {steps.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No steps added yet. Click &quot;Add Step&quot; to create your approval flow.
        </div>
      )}
    </div>
  );
}
