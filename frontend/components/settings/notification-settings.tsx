'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { NotificationPreferences } from '@/types';

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onChange: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {
  const handleToggle = (key: keyof NotificationPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const settings = [
    {
      key: 'emailNotifications' as const,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'expenseSubmitted' as const,
      label: 'Expense Submitted',
      description: 'When you submit an expense for approval',
    },
    {
      key: 'expenseApproved' as const,
      label: 'Expense Approved',
      description: 'When your expense is approved',
    },
    {
      key: 'expenseRejected' as const,
      label: 'Expense Rejected',
      description: 'When your expense is rejected',
    },
    {
      key: 'approvalRequired' as const,
      label: 'Approval Required',
      description: 'When an expense requires your approval',
    },
    {
      key: 'weeklyDigest' as const,
      label: 'Weekly Digest',
      description: 'Receive a weekly summary of your activity',
    },
    {
      key: 'monthlyReport' as const,
      label: 'Monthly Report',
      description: 'Receive a monthly expense report',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="notebook-shadow">
        <CardHeader>
          <CardTitle className="handwriting-text text-xl flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((setting, index) => (
            <motion.div
              key={setting.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-accent/30 rounded-lg"
            >
              <div className="space-y-0.5">
                <Label htmlFor={setting.key} className="text-base font-medium">
                  {setting.label}
                </Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                id={setting.key}
                checked={preferences[setting.key]}
                onCheckedChange={() => handleToggle(setting.key)}
              />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
