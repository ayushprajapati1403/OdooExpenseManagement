'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, MessageSquare, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ApprovalActionRecord } from '@/types';

interface ApprovalTimelineProps {
  actions: ApprovalActionRecord[];
  currentStep: number;
  totalSteps: number;
}

const actionConfig = {
  approved: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Rejected',
  },
};

export function ApprovalTimeline({
  actions,
  currentStep,
  totalSteps,
}: ApprovalTimelineProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="notebook-shadow">
      <CardHeader>
        <CardTitle className="handwriting-text text-2xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Approval History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval actions yet
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {actions.map((action, index) => {
                  const config = actionConfig[action.action];
                  const ActionIcon = config.icon;
                  const isLast = index === actions.length - 1;

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-8"
                    >
                      {!isLast && (
                        <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-border" />
                      )}

                      <div className="absolute left-0 top-0">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            config.bgColor
                          )}
                        >
                          <ActionIcon className={cn('h-4 w-4', config.color)} />
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="bg-accent/50 rounded-lg p-4 ml-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(action.approverName || 'User Name')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {action.approverName || 'John Doe'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {action.stepName || `Step ${index + 1}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="secondary"
                              className={cn('gap-1', config.bgColor, config.color)}
                            >
                              {config.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(action.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>

                        {action.comment && (
                          <div className="mt-3 p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs font-medium text-muted-foreground">
                                Comment
                              </p>
                            </div>
                            <p className="text-sm">{action.comment}</p>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}
