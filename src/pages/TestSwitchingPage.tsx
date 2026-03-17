import { useRegion } from '@/contexts/RegionContext';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';

export default function TestSwitchingPage() {
  const { isIndian, region } = useRegion();
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    testAPI();
  }, [isIndian]);

  const testAPI = async () => {
    setLoading(true);
    try {
      const url = isIndian ? '/api/indian/stats' : '/api/additives/stats';
      const res = await fetch(url);
      const data = await res.json();
      setApiTest({ success: true, data, url });
    } catch (error) {
      setApiTest({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className={`min-h-screen transition-colors ${isIndian ? 'bg-orange-50' : 'bg-blue-50'}`}>
        <div className="container py-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-4xl font-bold transition-colors ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
                {isIndian ? '🇮🇳 Indian Mode Test' : '🌍 Global Mode Test'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Toggle the switch to see UI changes in real-time
              </p>
            </div>
            <DatabaseToggle />
          </div>

          {/* Mode Indicator */}
          <Card className={`p-6 mb-8 ${isIndian ? 'bg-orange-100 border-orange-300' : 'bg-blue-100 border-blue-300'}`}>
            <div className="flex items-center gap-4">
              <div className={`text-6xl ${isIndian ? 'animate-bounce' : 'animate-pulse'}`}>
                {isIndian ? '🇮🇳' : '🌍'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Current Mode: {isIndian ? 'INDIAN' : 'GLOBAL'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Region: {region} | localStorage: {localStorage.getItem('nutrisight_region')}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className={`p-6 transition-all ${isIndian ? 'border-orange-200 hover:border-orange-400' : 'border-blue-200 hover:border-blue-400'}`}>
              <div className={`text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
                {isIndian ? '1,014' : '1.5M+'}
              </div>
              <div className="text-sm text-muted-foreground">Foods</div>
            </Card>
            <Card className={`p-6 transition-all ${isIndian ? 'border-orange-200 hover:border-orange-400' : 'border-blue-200 hover:border-blue-400'}`}>
              <div className={`text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
                {isIndian ? '10' : '50+'}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </Card>
            <Card className={`p-6 transition-all ${isIndian ? 'border-orange-200 hover:border-orange-400' : 'border-blue-200 hover:border-blue-400'}`}>
              <div className={`text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
                {isIndian ? '99.3%' : '95%'}
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
            <Card className={`p-6 transition-all ${isIndian ? 'border-orange-200 hover:border-orange-400' : 'border-blue-200 hover:border-blue-400'}`}>
              <div className={`text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
                {isIndian ? 'INDB' : 'USDA'}
              </div>
              <div className="text-sm text-muted-foreground">Source</div>
            </Card>
          </div>

          {/* Features Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {isIndian ? '✅ Available Features' : '❌ Not Available'}
              </h3>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Search Indian Foods</span>
                </div>
                <div className={`flex items-center gap-2 ${isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Calorie Prediction (99.3%)</span>
                </div>
                <div className={`flex items-center gap-2 ${isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Health Label Classification</span>
                </div>
                <div className={`flex items-center gap-2 ${isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Category Browser (10 types)</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {!isIndian ? '✅ Available Features' : '❌ Not Available'}
              </h3>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${!isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={!isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {!isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Additive Analysis</span>
                </div>
                <div className={`flex items-center gap-2 ${!isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={!isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {!isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Allergen Detection</span>
                </div>
                <div className={`flex items-center gap-2 ${!isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={!isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {!isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>Batch Processing</span>
                </div>
                <div className={`flex items-center gap-2 ${!isIndian ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <Badge className={!isIndian ? 'bg-green-600' : 'bg-gray-400'}>
                    {!isIndian ? '✓' : '✗'}
                  </Badge>
                  <span>API Keys & Webhooks</span>
                </div>
              </div>
            </Card>
          </div>

          {/* API Test */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">API Test</h3>
            {loading ? (
              <div>Loading...</div>
            ) : apiTest ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={apiTest.success ? 'bg-green-600' : 'bg-red-600'}>
                    {apiTest.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <span className="text-sm font-mono">{apiTest.url}</span>
                </div>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(apiTest, null, 2)}
                </pre>
              </div>
            ) : null}
          </Card>

          {/* Debug Info */}
          <Card className="p-6 bg-muted">
            <h3 className="text-lg font-bold mb-4">Debug Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <div className="font-bold mb-2">Context State:</div>
                <div>region: {region}</div>
                <div>isIndian: {String(isIndian)}</div>
              </div>
              <div>
                <div className="font-bold mb-2">Storage:</div>
                <div>localStorage: {localStorage.getItem('nutrisight_region')}</div>
                <div>data-region: {document.documentElement.getAttribute('data-region')}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
