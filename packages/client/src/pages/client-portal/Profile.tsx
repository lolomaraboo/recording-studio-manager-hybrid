import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { User, Mail, Phone, Save, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Client Portal Profile Page
 *
 * Allows clients to:
 * - View their profile information
 * - Update contact details
 * - Change password
 * - View account status
 */
export default function Profile() {
  const { client, updateClient } = useClientPortalAuth();
  usePageTitle('Profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);

    const sessionToken = localStorage.getItem('clientSessionToken');
    if (!sessionToken) {
      toast.error('Session expired. Please log in again.');
      setIsSaving(false);
      return;
    }

    try {
      const result = await (trpc.clientPortalAuth.updateProfile as any).mutate({
        sessionToken,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      });

      // Update local context with new client data
      if (result.client) {
        updateClient(result.client);
      }

      toast.success(result.message || 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const sessionToken = localStorage.getItem('clientSessionToken');
    if (!sessionToken) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await (trpc.clientPortalAuth.changePassword as any).mutate({
        sessionToken,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(result.message || 'Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      console.error('Password change error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    setFormData({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
    });
    setIsEditing(false);
  };

  if (!client) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Unable to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h2>
        </div>

        {/* Account Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription className="text-sm">Your current account information</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Account Type</p>
              <p className="text-sm text-muted-foreground">Standard Client</p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Client ID</p>
            <p className="text-sm text-muted-foreground font-mono">#{client.id.toString().padStart(6, '0')}</p>
          </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-sm">Your contact details and personal information</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center">
              <Phone className="mr-2 h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your phone number"
            />
          </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleProfileUpdate} disabled={isSaving} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" disabled={isSaving} size="sm">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription className="text-sm">Manage your password and security settings</CardDescription>
              </div>
              {!showPasswordForm && (
                <Button onClick={() => setShowPasswordForm(true)} variant="outline" size="sm">
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>
          {showPasswordForm && (
            <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
              />
            </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handlePasswordChange} disabled={isSaving} size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  {isSaving ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  variant="outline"
                  disabled={isSaving}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
