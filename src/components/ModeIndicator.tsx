import { useRegion } from '@/contexts/RegionContext';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe } from 'lucide-react';

export const ModeIndicator = () => {
  const { isIndian } = useRegion();

  if (isIndian) {
    return (
      <Badge className="bg-orange-600 hover:bg-orange-700 gap-1.5">
        <MapPin className="w-3 h-3" />
        Indian Mode
      </Badge>
    );
  }

  return (
    <Badge className="bg-blue-600 hover:bg-blue-700 gap-1.5">
      <Globe className="w-3 h-3" />
      Global Mode
    </Badge>
  );
};
