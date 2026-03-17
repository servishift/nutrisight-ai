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
import { Plus, Trash2, Edit, FileText, Image as ImageIcon, Globe } from 'lucide-react';
import { getContentPages, createContentPage, updateContentPage, deleteContentPage } from '../services/admin-api';
import { toast } from 'sonner';

const PAGE_TYPES = [
  { value: 'banner', label: 'Homepage Banner' },
  { value: 'about', label: 'About Page' },
  { value: 'blog', label: 'Blog Article' },
  { value: 'tip', label: 'Nutrition Tip' },
  { value: 'faq', label: 'FAQ' },
  { value: 'terms', label: 'Terms & Conditions' },
  { value: 'privacy', label: 'Privacy Policy' },
];

export default function AdminContentPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editPage, setEditPage] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadPages();
  }, [filter]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await getContentPages(filter === 'all' ? undefined : filter);
      setPages(data);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      type: formData.get('type') as string,
      content: formData.get('content') as string,
      excerpt: formData.get('excerpt') as string,
      metaTitle: formData.get('metaTitle') as string,
      metaDescription: formData.get('metaDescription') as string,
      metaKeywords: (formData.get('metaKeywords') as string).split(',').map(k => k.trim()),
      featuredImage: formData.get('featuredImage') as string,
      published: formData.get('published') === 'on'
    };

    try {
      if (editPage) {
        await updateContentPage(editPage.id, data);
        toast.success('Page updated successfully');
      } else {
        await createContentPage(data);
        toast.success('Page created successfully');
      }
      setDialog(false);
      setEditPage(null);
      loadPages();
    } catch (error) {
      toast.error('Failed to save page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try {
      await deleteContentPage(id);
      toast.success('Page deleted');
      loadPages();
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const handleEdit = (page: any) => {
    setEditPage(page);
    setDialog(true);
  };

  const handleNewPage = () => {
    setEditPage(null);
    setDialog(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const filteredPages = pages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Content Management</h1>
          <p className="text-sm text-muted-foreground">Manage website content, blogs, and pages</p>
        </div>
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPage}><Plus className="mr-2 h-4 w-4" />Create Page</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" defaultValue={editPage?.title} required />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input id="slug" name="slug" defaultValue={editPage?.slug} placeholder="about-us" required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="type">Page Type *</Label>
                <Select name="type" defaultValue={editPage?.type || 'blog'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={editPage?.excerpt} placeholder="Short description..." />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea id="content" name="content" rows={10} defaultValue={editPage?.content} required />
              </div>

              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input id="featuredImage" name="featuredImage" defaultValue={editPage?.featuredImage} placeholder="https://..." />
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3 font-semibold">SEO Settings</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input id="metaTitle" name="metaTitle" defaultValue={editPage?.metaTitle} />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={editPage?.metaDescription} />
                  </div>
                  <div>
                    <Label htmlFor="metaKeywords">Meta Keywords (comma separated)</Label>
                    <Input id="metaKeywords" name="metaKeywords" defaultValue={editPage?.metaKeywords?.join(', ')} placeholder="nutrition, health, food" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="published" name="published" defaultChecked={editPage?.published} />
                <Label htmlFor="published">Published</Label>
              </div>

              <Button type="submit" className="w-full">{editPage ? 'Update Page' : 'Create Page'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="banner">Banners</TabsTrigger>
          <TabsTrigger value="blog">Blogs</TabsTrigger>
          <TabsTrigger value="tip">Tips</TabsTrigger>
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="about">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <div className="grid gap-4">
            {filteredPages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{page.title}</CardTitle>
                        {page.published ? (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Published</span>
                        ) : (
                          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">Draft</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">/{page.slug}</p>
                      {page.excerpt && <p className="mt-2 text-sm text-muted-foreground">{page.excerpt}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {PAGE_TYPES.find(t => t.value === page.type)?.label}
                    </span>
                    {page.featuredImage && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Has Image
                      </span>
                    )}
                    {page.metaTitle && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        SEO Optimized
                      </span>
                    )}
                    <span>Updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
