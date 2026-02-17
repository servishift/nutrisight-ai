import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Camera, LogOut } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password form
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const { updateProfile } = await import('@/services/auth-service');
      await updateProfile({
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber,
      });
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassMsg(null);
    if (passwords.newPass.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPassError('Passwords do not match');
      return;
    }
    setPassLoading(true);
    try {
      const { updatePassword } = await import('@/services/auth-service');
      await updatePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPassMsg('Password changed successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-2xl py-10 md:py-16">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Avatar section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {user?.displayName || 'User'}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email || 'No email set'}</p>
          </div>
        </motion.div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General tab */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-6"
            >
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Personal Information
              </h3>

              {profileMsg && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="profileEmail"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 opacity-60"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phoneNumber}
                      onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </motion.div>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="card-elevated p-6">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Change Password
                </h3>

                {passError && (
                  <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {passError}
                  </div>
                )}
                {passMsg && (
                  <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                    {passMsg}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={passwords.newPass}
                        onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmNewPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={passLoading}>
                    {passLoading ? 'Changing…' : 'Change password'}
                  </Button>
                </form>
              </div>

              <Separator />

              <div className="card-elevated p-6">
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                  Two-Factor Authentication
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add an extra layer of security. Available after backend integration.
                </p>
                <Button variant="outline" disabled>
                  Enable 2FA (coming soon)
                </Button>
              </div>

              <Separator />

              <Button variant="destructive" className="gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
