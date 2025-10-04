'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, MapPin, Briefcase, FileText, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { NotebookContainer } from '@/components/layout/notebook-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';

function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>({
    id: '1',
    email: 'john.doe@company.com',
    fullName: 'John Doe',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    bio: 'Passionate about building great products and leading innovative teams.',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        avatarUrl: URL.createObjectURL(file),
      }));
      setIsUploading(false);
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    }, 1500);
  };

  const handleAvatarRemove = () => {
    setProfile((prev) => ({
      ...prev,
      avatarUrl: undefined,
    }));
    toast({
      title: 'Success',
      description: 'Profile picture removed',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    }, 1000);
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 handwriting-text flex items-center gap-2">
            <User className="h-8 w-8" />
            My Profile
          </h2>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="notebook-shadow">
              <CardHeader>
                <CardTitle className="handwriting-text text-xl">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentAvatar={profile.avatarUrl}
                  userName={profile.fullName}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <NotebookContainer animate={false}>
              <div className="space-y-6">
                <Card className="notebook-shadow">
                  <CardHeader>
                    <CardTitle className="handwriting-text text-xl">
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={profile.fullName}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john.doe@company.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={profile.location || ''}
                          onChange={(e) => handleChange('location', e.target.value)}
                          placeholder="San Francisco, CA"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="notebook-shadow">
                  <CardHeader>
                    <CardTitle className="handwriting-text text-xl">
                      Work Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department" className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Department
                        </Label>
                        <Input
                          id="department"
                          value={profile.department || ''}
                          onChange={(e) => handleChange('department', e.target.value)}
                          placeholder="Engineering"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position" className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Position
                        </Label>
                        <Input
                          id="position"
                          value={profile.position || ''}
                          onChange={(e) => handleChange('position', e.target.value)}
                          placeholder="Senior Software Engineer"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" onClick={handleSave} disabled={isSaving}>
                      <Save className="h-5 w-5 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </NotebookContainer>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
