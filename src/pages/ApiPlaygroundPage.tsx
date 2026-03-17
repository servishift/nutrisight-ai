import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE } from '@/services/api-base';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Loader2, Copy, Terminal, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ApiPlaygroundResponse } from '@/types/phase4';

const ENDPOINTS = [
  { value: '/api/analyze', label: 'POST /api/analyze', method: 'POST' as const },
  { value: '/api/phase3/similarity', label: 'POST /api/phase3/similarity', method: 'POST' as const },
  { value: '/api/phase3/brand-prediction', label: 'POST /api/phase3/brand-prediction', method: 'POST' as const },
  { value: '/api/phase3/reformulation', label: 'POST /api/phase3/reformulation', method: 'POST' as const },
  { value: '/api/phase3/embeddings', label: 'POST /api/phase3/embeddings', method: 'POST' as const },
  { value: '/api/nutrition/analyze', label: 'POST /api/nutrition/analyze', method: 'POST' as const },
  { value: '/api/indian/analyze/indian', label: 'POST /api/indian/analyze/indian', method: 'POST' as const },
  { value: '/api/auth/me', label: 'GET /api/auth/me', method: 'GET' as const },
];

const DEFAULT_BODIES: Record<string, string> = {
  '/api/analyze': JSON.stringify({ ingredientText: 'Enriched Wheat Flour, Sugar, Palm Oil, Cocoa Powder, Soy Lecithin, Milk Powder, Salt' }, null, 2),
  '/api/phase3/similarity': JSON.stringify({ ingredients: 'Oats, Honey, Almonds, Rice Syrup', topK: 5 }, null, 2),
  '/api/phase3/brand-prediction': JSON.stringify({ ingredients: 'Enriched Flour, Sugar, Palm Oil, Cocoa, Soy Lecithin', topK: 5 }, null, 2),
  '/api/phase3/reformulation': JSON.stringify({ originalIngredients: 'Wheat Flour, Sugar, Palm Oil, Red 40', updatedIngredients: 'Wheat Flour, Sugar, Sunflower Oil, Beet Juice' }, null, 2),
  '/api/phase3/embeddings': JSON.stringify({ category: 'Snacks' }, null, 2),
  '/api/nutrition/analyze': JSON.stringify({ ingredients: 'chicken breast\nbrown rice\nbroccoli' }, null, 2),
  '/api/indian/analyze/indian': JSON.stringify({ food_name: 'Dal Makhani', ingredients: 'Black lentils, butter, cream, tomatoes, spices' }, null, 2),
  '/api/auth/me': '',
};

export default function ApiPlaygroundPage() {
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0].value);
  const [body, setBody] = useState(DEFAULT_BODIES[ENDPOINTS[0].value]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiPlaygroundResponse | null>(null);
  const { toast } = useToast();

  const selectedEndpoint = ENDPOINTS.find((e) => e.value === endpoint)!;

  const handleEndpointChange = (val: string) => {
    setEndpoint(val);
    setBody(DEFAULT_BODIES[val] || '');
    setResponse(null);
  };

  const handleSend = async () => {
    setLoading(true);
    const start = Date.now();

    try {
      const base = API_BASE || '';
      const tokens = JSON.parse(localStorage.getItem('foodintel_auth_tokens') || 'null');
      const token = tokens?.accessToken;
      const res = await fetch(`${base}${endpoint}`, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(selectedEndpoint.method === 'POST' && body ? { body } : {}),
      });

      const responseBody = await res.text();
      setResponse({
        status: res.status,
        body: responseBody,
        headers: Object.fromEntries(res.headers.entries()),
        latencyMs: Date.now() - start,
      });
    } catch (err: any) {
      setResponse({
        status: 0,
        body: JSON.stringify({ error: err?.message || 'Network error — backend unreachable' }, null, 2),
        headers: { 'x-error': 'network' },
        latencyMs: Date.now() - start,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
      toast({ title: 'Copied response' });
    }
  };

  const generateCurl = () => {
    const tokens = JSON.parse(localStorage.getItem('foodintel_auth_tokens') || 'null');
    const token = tokens?.accessToken || 'YOUR_API_KEY';
    const base = API_BASE || 'https://api.foodintel.ai';
    let cmd = `curl -X ${selectedEndpoint.method} "${base}${endpoint}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json"`;
    if (selectedEndpoint.method === 'POST' && body) {
      cmd += ` \\\n  -d '${body.replace(/\n/g, '')}'`;
    }
    return cmd;
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-success';
    if (status < 400) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Phase 4</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">Developer</Badge>
          </div>
          <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
            <Terminal className="mr-2 inline h-8 w-8 text-primary" />
            API Playground
          </h1>
          <p className="text-muted-foreground">Test API endpoints interactively</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={endpoint} onValueChange={handleEndpointChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        <span className="font-mono text-sm">{e.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedEndpoint.method === 'POST' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Body (JSON)</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={8}
                      className="resize-none font-mono text-xs"
                    />
                  </div>
                )}

                <Button onClick={handleSend} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {loading ? 'Sending…' : 'Send Request'}
                </Button>
              </CardContent>
            </Card>

            {/* cURL */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Code2 className="h-4 w-4" /> cURL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs text-foreground">
                  {generateCurl()}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Response */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response</CardTitle>
                  {response && (
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold ${getStatusColor(response.status)}`}>
                        {response.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{response.latencyMs}ms</span>
                      <Button variant="ghost" size="icon" onClick={copyResponse}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!response ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">Send a request to see the response</p>
                  </div>
                ) : (
                  <Tabs defaultValue="body">
                    <TabsList>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="body">
                      <pre className="max-h-[400px] overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-foreground">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(response.body), null, 2); } catch { return response.body; }
                        })()}
                      </pre>
                    </TabsContent>
                    <TabsContent value="headers">
                      <div className="space-y-1">
                        {Object.entries(response.headers).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs">
                            <span className="font-mono font-medium text-primary">{k}:</span>
                            <span className="text-muted-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
