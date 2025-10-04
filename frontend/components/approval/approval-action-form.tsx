'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle, Circle as XCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ApprovalActionFormProps {
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  isProcessing?: boolean;
}

export function ApprovalActionForm({
  onApprove,
  onReject,
  isProcessing,
}: ApprovalActionFormProps) {
  const [comment, setComment] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState<'approve' | 'reject' | null>(
    null
  );

  const handleSubmit = () => {
    if (selectedAction === 'approve') {
      onApprove(comment);
    } else if (selectedAction === 'reject') {
      onReject(comment);
    }
    setComment('');
    setSelectedAction(null);
  };

  return (
    <Card className="notebook-shadow">
      <CardHeader>
        <CardTitle className="handwriting-text text-2xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Take Action
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comment" className="handwriting-text text-base">
            Comment (Optional)
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your comments here..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={() => {
                setSelectedAction('reject');
                setTimeout(handleSubmit, 0);
              }}
              disabled={isProcessing}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setSelectedAction('approve');
                setTimeout(handleSubmit, 0);
              }}
              disabled={isProcessing}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Your decision will be recorded in the approval history
        </p>
      </CardContent>
    </Card>
  );
}
