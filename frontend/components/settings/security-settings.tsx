'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SecuritySettings } from '@/types';

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onChange: (settings: SecuritySettings) => void;
  onChangePassword: () => void;
}

export function SecuritySettingsComponent({
  settings,
  onChange,
  onChangePassword,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="notebook-shadow">
          <CardHeader>
            <CardTitle className="handwriting-text text-xl flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="2fa" className="text-base font-medium">
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="2fa"
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...settings, twoFactorEnabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Timeout
              </Label>
              <Select
                value={settings.sessionTimeout.toString()}
                onValueChange={(value) =>
                  onChange({ ...settings, sessionTimeout: parseInt(value) })
                }
              >
                <SelectTrigger id="sessionTimeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Automatically log out after this period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="notebook-shadow">
          <CardHeader>
            <CardTitle className="handwriting-text text-xl flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>
              Change your password regularly to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.lastPasswordChange && (
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Last changed: {new Date(settings.lastPasswordChange).toLocaleDateString()}
                </p>
              </div>
            )}

            <Button onClick={onChangePassword} variant="outline" className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
