import { useRegion } from '@/contexts/RegionContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatabaseToggle } from '@/components/DatabaseToggle';

// EXAMPLE: Complete UI Switching Component
export const ExampleSwitchingPage = () => {
  const { isIndian, region } = useRegion();

  return (
    <div className="container py-10">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-blue-600'}`}>
            {isIndian ? '🇮🇳 Indian Food Database' : '🌍 Global Food Database'}
          </h1>
          <p className="text-muted-foreground">
            {isIndian ? '1,014 authentic Indian foods' : '1.5M+ global foods'}
          </p>
        </div>
        <DatabaseToggle />
      </div>

      {/* Stats Cards - Different Data */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className={`p-6 ${isIndian ? 'border-orange-200' : 'border-blue-200'}`}>
          <div className="text-3xl font-bold">{isIndian ? '1,014' : '1.5M+'}</div>
          <div className="text-sm text-muted-foreground">Total Foods</div>
        </Card>
        <Card className={`p-6 ${isIndian ? 'border-orange-200' : 'border-blue-200'}`}>
          <div className="text-3xl font-bold">{isIndian ? '10' : '50+'}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </Card>
        <Card className={`p-6 ${isIndian ? 'border-orange-200' : 'border-blue-200'}`}>
          <div className="text-3xl font-bold">{isIndian ? '99.3%' : '95%'}</div>
          <div className="text-sm text-muted-foreground">ML Accuracy</div>
        </Card>
      </div>

      {/* Features - Different Lists */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Available Features</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {isIndian ? (
            <>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Search Indian Foods</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Calorie Prediction (99.3%)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Health Label Classification</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Category Browser</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">✗</Badge>
                <span className="text-muted-foreground">Additive Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">✗</Badge>
                <span className="text-muted-foreground">Batch Processing</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Additive Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Allergen Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>Batch Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">✓</Badge>
                <span>API Keys & Webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">✗</Badge>
                <span className="text-muted-foreground">Indian Calorie Prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">✗</Badge>
                <span className="text-muted-foreground">Indian Categories</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Database Info - Different Content */}
      <Card className={`p-6 ${isIndian ? 'bg-orange-50' : 'bg-blue-50'}`}>
        <h3 className="font-bold mb-2">Database Information</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Source:</strong> {isIndian ? 'Anuvaad INDB 2024.11' : 'USDA FoodData Central'}</p>
          <p><strong>Region:</strong> {isIndian ? 'India' : 'Global'}</p>
          <p><strong>Last Updated:</strong> {isIndian ? 'November 2024' : 'Continuous'}</p>
          <p><strong>API Endpoint:</strong> {isIndian ? '/api/indian/*' : '/api/*'}</p>
        </div>
      </Card>

      {/* Debug Info */}
      <Card className="p-4 mt-8 bg-muted">
        <h4 className="font-mono text-xs mb-2">Debug Info:</h4>
        <pre className="text-xs">
          {JSON.stringify({ region, isIndian }, null, 2)}
        </pre>
      </Card>
    </div>
  );
};
