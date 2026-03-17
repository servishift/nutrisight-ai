import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe, MapPin, Check } from 'lucide-react';
import { useRegion } from '@/contexts/RegionContext';

interface RegionOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export const RegionOnboarding = ({ open, onComplete }: RegionOnboardingProps) => {
  const { setRegion } = useRegion();
  const [selected, setSelected] = useState<'us' | 'indian' | null>(null);

  const handleSelect = (region: 'us' | 'indian') => {
    setSelected(region);
    setRegion(region);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Region</DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            We offer specialized nutrition databases for different regions. Select your preferred database to get the most accurate results.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* US/Global Option */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selected === 'us' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelect('us')}
          >
            <div className="flex items-center justify-between mb-4">
              <Globe className="w-12 h-12 text-blue-600" />
              {selected === 'us' && <Check className="w-6 h-6 text-primary" />}
            </div>
            <h3 className="text-xl font-bold mb-2">🌍 Global Database</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Access to 1.5M+ foods from USDA FoodData Central
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Complete additive analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>ML-powered predictions</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Allergen detection</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Batch processing</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>API access</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant={selected === 'us' ? 'default' : 'outline'}>
              Select Global
            </Button>
          </Card>

          {/* Indian Option */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selected === 'indian' ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => handleSelect('indian')}
          >
            <div className="flex items-center justify-between mb-4">
              <MapPin className="w-12 h-12 text-orange-600" />
              {selected === 'indian' && <Check className="w-6 h-6 text-orange-600" />}
            </div>
            <h3 className="text-xl font-bold mb-2">🇮🇳 Indian Database</h3>
            <p className="text-sm text-muted-foreground mb-4">
              1,014 authentic Indian foods from Anuvaad INDB
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Indian cuisine focused</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Regional food categories</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Calorie prediction (99.3% accuracy)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Health label classification</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Similar food recommendations</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700" variant={selected === 'indian' ? 'default' : 'outline'}>
              Select Indian
            </Button>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-center">
            <strong>Why we ask:</strong> Different regions have unique food products and nutritional databases. 
            Selecting your region ensures you get the most relevant and accurate nutrition information. 
            You can switch regions anytime from settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
