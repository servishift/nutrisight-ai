import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getSettings, updateSettings } from '../services/admin-api';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState('off');
  const navigate = useNavigate();
  const [adminMaintenance, setAdminMaintenance] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [freeAnalysisLimit, setFreeAnalysisLimit] = useState('10');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setMaintenanceMode(data.maintenanceMode || 'off');
      setAdminMaintenance(data.adminMaintenance || false);
      setRegistrationOpen(data.registrationOpen !== false);
      setFreeAnalysisLimit(String(data.freeAnalysisLimit || 10));
      setSmtpEmail(data.smtpEmail || 'ashishjaiswalvlogsandtech@gmail.com');
      setSmtpHost(data.smtpHost || 'smtp.gmail.com');
      setSmtpPort(String(data.smtpPort || 587));
      setApiBaseUrl(data.apiBaseUrl || 'http://localhost:5000');
      setFirebaseProjectId(data.firebaseProjectId || 'nutrisight-ai-b34da');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data: any = {
        maintenanceMode,
        adminMaintenance,
        registrationOpen,
        freeAnalysisLimit: parseInt(freeAnalysisLimit),
        smtpEmail,
        smtpHost,
        smtpPort: parseInt(smtpPort),
        apiBaseUrl,
        firebaseProjectId
      };
      if (smtpPassword) data.smtpPassword = smtpPassword;
      await updateSettings(data);
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  if (!loading && smtpEmail === '') {
    setSmtpEmail('ashishjaiswalvlogsandtech@gmail.com');
    setApiBaseUrl('http://localhost:5000');
    setFirebaseProjectId('nutrisight-ai-b34da');
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/10 p-2">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Backend Connection</h3>
            <p className="text-xs text-muted-foreground">
              Settings save to Firebase. Backend: <code className="bg-muted px-1 py-0.5 rounded">{apiBaseUrl || 'http://localhost:5000'}</code>
            </p>
          </div>
        </div>
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform configuration</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Core platform settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground mb-3">Control platform accessibility for users (admins always have access)</p>
            </div>
            <RadioGroup value={maintenanceMode} onValueChange={setMaintenanceMode}>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="off" id="off" />
                <div className="flex-1">
                  <Label htmlFor="off" className="font-medium cursor-pointer">Off</Label>
                  <p className="text-xs text-muted-foreground">Platform fully accessible to all users</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="partial" id="partial" />
                <div className="flex-1">
                  <Label htmlFor="partial" className="font-medium cursor-pointer">Partial Maintenance</Label>
                  <p className="text-xs text-muted-foreground">Read-only mode - users can view but not analyze/create</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors">
                <RadioGroupItem value="full" id="full" />
                <div className="flex-1">
                  <Label htmlFor="full" className="font-medium cursor-pointer">Full Maintenance</Label>
                  <p className="text-xs text-muted-foreground">Platform disabled for users (admins can still access)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 hover:bg-red-500/10 transition-colors">
                <RadioGroupItem value="admin" id="admin" />
                <div className="flex-1">
                  <Label htmlFor="admin" className="font-medium cursor-pointer">Admin Maintenance</Label>
                  <p className="text-xs text-muted-foreground">Platform disabled for everyone including admins</p>
                </div>
              </div>
            </RadioGroup>
            {maintenanceMode === 'admin' && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs text-red-600 font-medium">⚠️ Warning: This will lock out all admins. Only use for critical system maintenance.</p>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Open Registration</p>
              <p className="text-xs text-muted-foreground">Allow new users to sign up</p>
            </div>
            <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Free Plan Analysis Limit (per day)</Label>
            <Input type="number" value={freeAnalysisLimit} onChange={(e) => setFreeAnalysisLimit(e.target.value)} className="max-w-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Configuration</CardTitle>
          <CardDescription>SMTP settings for transactional emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Email</Label>
              <Input placeholder="noreply@foodintel.ai" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input type="password" placeholder="••••••••" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing management quick access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Management</CardTitle>
          <CardDescription>Use this to configure plan prices and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Edit platform and API subscription plans in the dedicated pricing panel.
          </p>
          <Button onClick={() => navigate('/admin/pricing')} className="w-full">
            Open Admin Pricing Page
          </Button>
        </CardContent>
      </Card>

      {/* API */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Configuration</CardTitle>
          <CardDescription>Backend connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input placeholder="https://api.foodintel.ai" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Firebase Project ID</Label>
            <Input placeholder="foodintel-prod" value={firebaseProjectId} onChange={(e) => setFirebaseProjectId(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
