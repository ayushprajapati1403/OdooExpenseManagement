'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Save,
  Upload,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { NotebookContainer } from '@/components/layout/notebook-container';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/supabase';
import type { CompanySettings, Currency } from '@/types';

function CompanySettingsPage() {
  const [settings, setSettings] = React.useState<CompanySettings>({
    id: '1',
    name: 'Acme Corporation',
    currency: 'USD',
    defaultApprovalFlow: 'flow-1',
    website: 'https://acme.com',
    industry: 'Technology',
    size: '50-200',
    address: '123 Main St, Suite 100',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    fiscalYearStart: '2024-01-01', // Fixed date format
    updatedAt: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [companyStats, setCompanyStats] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string>('');
  const { toast } = useToast();

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { value: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
    { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  ];

  React.useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile to get company info
      const userProfile = await apiClient.getUserProfile();
      setUserRole(userProfile.role);
      
      // Only load company statistics if user is admin
      if (userProfile.role === 'ADMIN') {
        try {
          const statsResponse = await apiClient.getCompanyStats();
          setCompanyStats(statsResponse.statistics);
        } catch (error) {
          console.warn('Failed to load company statistics (admin only):', error);
          // Don't show error for non-admin users
        }
      }
      
      setSettings(prev => ({
        ...prev,
        id: userProfile.companyId || '',
        // Note: Company name and other details not available in current backend
        // These would need to be added to the Company model
      }));
    } catch (error) {
      console.error('Failed to load company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ];

  const handleSave = async () => {
    setIsSaving(true);

    // Note: Company settings update not yet implemented in backend
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Info',
        description: 'Company settings update is not yet available. The backend needs additional company fields to be implemented.',
      });
    }, 1000);
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
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
              <Building2 className="h-8 w-8" />
              Company Settings
            </h2>
            <p className="text-muted-foreground">
              Manage your organization's configuration
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" onClick={handleSave} disabled={isSaving || isLoading}>
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        </div>

        {/* User Role Indicator */}
        {userRole && (
          <div className="mb-6 p-4 bg-accent/50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">
                Current Role: <span className="text-primary">{userRole}</span>
                {userRole !== 'ADMIN' && (
                  <span className="text-muted-foreground ml-2">
                    (Company statistics require admin access)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading company information...</p>
            </div>
          </div>
        ) : (
          <NotebookContainer animate={false}>
            {/* Company Statistics */}
            {companyStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <Card className="notebook-shadow">
                  <CardHeader>
                    <CardTitle className="handwriting-text text-xl flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Statistics
                    </CardTitle>
                    <CardDescription>
                      Overview of your company's expense management activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{companyStats.totalUsers}</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </div>
                      <div className="text-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{companyStats.totalExpenses}</div>
                        <div className="text-sm text-muted-foreground">Total Expenses</div>
                      </div>
                      <div className="text-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{companyStats.pendingExpenses}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{companyStats.approvedExpenses}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="notebook-shadow">
                <CardHeader>
                  <CardTitle className="handwriting-text text-xl flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://company.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={settings.industry || ''}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        placeholder="Technology"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Company Size
                      </Label>
                      <Select
                        value={settings.size}
                        onValueChange={(value) => handleChange('size', value)}
                      >
                        <SelectTrigger id="size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={settings.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="123 Main St, Suite 100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={settings.country || ''}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="notebook-shadow">
                <CardHeader>
                  <CardTitle className="handwriting-text text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Settings
                  </CardTitle>
                  <CardDescription>
                    Configure currency and fiscal year
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) => handleChange('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.symbol} {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiscalYear" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fiscal Year Start
                    </Label>
                    <Input
                      id="fiscalYear"
                      type="date"
                      value={settings.fiscalYearStart || ''}
                      onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The start date of your fiscal year
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="notebook-shadow">
                <CardHeader>
                  <CardTitle className="handwriting-text text-xl">
                    System Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => handleChange('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time (US)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time (US)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time (US)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time (US)
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultFlow">Default Approval Flow</Label>
                    <Select
                      value={settings.defaultApprovalFlow}
                      onValueChange={(value) =>
                        handleChange('defaultApprovalFlow', value)
                      }
                    >
                      <SelectTrigger id="defaultFlow">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flow-1">Standard Approval</SelectItem>
                        <SelectItem value="flow-2">Executive Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </NotebookContainer>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

export default function CompanySettings() {
  return (
    <ProtectedRoute>
      <CompanySettingsPage />
    </ProtectedRoute>
  );
}
