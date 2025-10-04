'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { SecuritySettingsComponent } from '@/components/settings/security-settings';
import { ThemeSettings } from '@/components/settings/theme-settings';
import { NotebookContainer } from '@/components/layout/notebook-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPreferences, SecuritySettings } from '@/types';

function SettingsPage() {
  const [notifications, setNotifications] = React.useState<NotificationPreferences>({
    emailNotifications: true,
    expenseSubmitted: true,
    expenseApproved: true,
    expenseRejected: true,
    approvalRequired: true,
    weeklyDigest: false,
    monthlyReport: true,
  });

  const [security, setSecurity] = React.useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    }, 1000);
  };

  const handleChangePassword = () => {
    setShowPasswordDialog(true);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 handwriting-text flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="notifications">
              <NotebookContainer animate={false}>
                <NotificationSettings
                  preferences={notifications}
                  onChange={setNotifications}
                />
              </NotebookContainer>
            </TabsContent>

            <TabsContent value="security">
              <NotebookContainer animate={false}>
                <SecuritySettingsComponent
                  settings={security}
                  onChange={setSecurity}
                  onChangePassword={handleChangePassword}
                />
              </NotebookContainer>
            </TabsContent>

            <TabsContent value="theme">
              <NotebookContainer animate={false}>
                <ThemeSettings />
              </NotebookContainer>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
