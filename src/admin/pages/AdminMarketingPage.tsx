import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Send, Tag, Mail, History, TrendingUp, Zap, Edit } from 'lucide-react';
import { getCoupons, createCoupon, deleteCoupon, getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, sendEmailCampaign, getEmailCampaigns, getCouponAnalytics } from '../services/admin-api';
import { toast } from 'sonner';

export default function AdminMarketingPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponDialog, setCouponDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [campaignDialog, setCampaignDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponsData, templatesData, campaignsData, analyticsData] = await Promise.all([
        getCoupons(),
        getEmailTemplates(),
        getEmailCampaigns(),
        getCouponAnalytics()
      ]);
      setCoupons(couponsData.coupons);
      setTemplates(templatesData.templates);
      setCampaigns(campaignsData.campaigns);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createCoupon({
        code: formData.get('code') as string,
        discount: Number(formData.get('discount')),
        discountType: formData.get('discountType') as string,
        maxUses: Number(formData.get('maxUses')) || 0,
        expiresAt: formData.get('expiresAt') as string
      });
      toast.success('Coupon created successfully');
      setCouponDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createEmailTemplate({
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        body: formData.get('body') as string,
        type: formData.get('type') as string,
        active: formData.get('active') === 'on'
      });
      toast.success('Template created (NOT sent to anyone)');
      setTemplateDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteEmailTemplate(id);
      toast.success('Template deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleSendCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await sendEmailCampaign({
        subject: formData.get('subject') as string,
        body: formData.get('body') as string,
        recipientType: formData.get('recipientType') as string
      });
      toast.success(result.message);
      setCampaignDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Marketing & Promotions</h1>
        <p className="text-sm text-muted-foreground">Manage coupons, email templates, and campaigns</p>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCoupons}</div>
              <p className="text-xs text-muted-foreground">{analytics.activeCoupons} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalRedemptions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground">Total campaigns</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coupons"><Tag className="mr-2 h-4 w-4" />Coupons</TabsTrigger>
          <TabsTrigger value="templates"><Mail className="mr-2 h-4 w-4" />Email Templates</TabsTrigger>
          <TabsTrigger value="campaigns"><Send className="mr-2 h-4 w-4" />Campaigns</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Create Coupon</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div>
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" name="code" placeholder="SAVE20" required />
                  </div>
                  <div>
                    <Label htmlFor="discount">Discount Value</Label>
                    <Input id="discount" name="discount" type="number" placeholder="20" required />
                  </div>
                  <div>
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select name="discountType" defaultValue="percentage">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxUses">Max Uses (0 = unlimited)</Label>
                    <Input id="maxUses" name="maxUses" type="number" defaultValue="0" />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expires At</Label>
                    <Input id="expiresAt" name="expiresAt" type="datetime-local" />
                  </div>
                  <Button type="submit" className="w-full">Create Coupon</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold">{coupon.discount}{coupon.discountType === 'percentage' ? '%' : '$'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span>{coupon.usedCount} / {coupon.maxUses || '∞'}</span>
                  </div>
                  {coupon.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Templates are for AUTO-SEND only. Creating/editing a template does NOT send emails.
              Templates are automatically used when events occur (user registration, password reset, etc.).
            </p>
          </div>
          
          <div className="flex justify-end">
            <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Create Template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Email Template (Auto-Send)</DialogTitle>
                  <p className="text-sm text-muted-foreground">This template will be used automatically for system events. It will NOT be sent immediately.</p>
                </DialogHeader>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" name="name" placeholder="Welcome Email" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Template Type (Auto-Send Event)</Label>
                    <Select name="type" defaultValue="welcome">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome (sent on registration)</SelectItem>
                        <SelectItem value="verification">Email Verification</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                        <SelectItem value="promotion">Promotion (for campaigns)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input id="subject" name="subject" placeholder="Welcome to NutriSight!" required />
                  </div>
                  <div>
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea id="body" name="body" rows={8} placeholder="Hi {{name}},&#10;&#10;Welcome to NutriSight AI..." required />
                    <p className="mt-1 text-xs text-muted-foreground">Use {`{{name}}`}, {`{{email}}`} for personalization</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="active" name="active" />
                    <Label htmlFor="active">Active (use this template for auto-send)</Label>
                  </div>
                  <Button type="submit" className="w-full">Create Template</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.active ? (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Active</span>
                        ) : (
                          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="line-clamp-3 whitespace-pre-wrap">{template.body}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs text-primary capitalize">{template.type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>📧 Campaigns:</strong> Use this to manually send emails to users NOW. Select recipients and send immediately.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Dialog open={campaignDialog} onOpenChange={setCampaignDialog}>
              <DialogTrigger asChild>
                <Button><Send className="mr-2 h-4 w-4" />Send Campaign Now</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Email Campaign (Immediate Broadcast)</DialogTitle>
                  <p className="text-sm text-muted-foreground">This will send emails immediately to selected users.</p>
                </DialogHeader>
                <form onSubmit={handleSendCampaign} className="space-y-4">
                  <div>
                    <Label htmlFor="recipientType">Recipients</Label>
                    <Select name="recipientType" defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="new">New Users (Last 7 days)</SelectItem>
                        <SelectItem value="active">Active Users (Last 30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input id="subject" name="subject" placeholder="Special Offer Inside!" required />
                  </div>
                  <div>
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea id="body" name="body" rows={10} placeholder="Dear valued customer..." required />
                  </div>
                  <Button type="submit" className="w-full">Send Campaign Now</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{campaign.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Sent by {campaign.sentBy}</p>
                  </div>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs ${campaign.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {campaign.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Recipients: </span>
                    <span className="font-semibold">{campaign.recipientCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="capitalize">{campaign.recipientType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span>{new Date(campaign.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
