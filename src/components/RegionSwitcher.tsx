import { Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRegion } from '@/contexts/RegionContext';
import { useNavigate } from 'react-router-dom';

export const RegionSwitcher = () => {
  const { region, setRegion, isIndian } = useRegion();
  const navigate = useNavigate();

  const handleSwitch = (newRegion: 'us' | 'indian') => {
    setRegion(newRegion);
    if (newRegion === 'indian') {
      navigate('/indian');
    } else {
      navigate('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isIndian ? (
            <>
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Indian</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Global</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSwitch('us')} className="cursor-pointer">
          <Globe className="w-4 h-4 mr-2" />
          <div>
            <div className="font-medium">🌍 Global Database</div>
            <div className="text-xs text-muted-foreground">1.5M+ foods</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSwitch('indian')} className="cursor-pointer">
          <MapPin className="w-4 h-4 mr-2" />
          <div>
            <div className="font-medium">🇮🇳 Indian Database</div>
            <div className="text-xs text-muted-foreground">1,014 foods</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
