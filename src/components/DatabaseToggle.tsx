import { Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegion } from '@/contexts/RegionContext';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const DatabaseToggle = () => {
  const { region, setRegion, isIndian } = useRegion();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<'us' | 'indian' | null>(null);
  
  const handleRegionChange = (newRegion: 'us' | 'indian') => {
    if (newRegion === region) return;
    
    // Show warning if user has been on the page (not first load)
    const hasWarned = sessionStorage.getItem('region_switch_warned');
    if (!hasWarned) {
      setPendingRegion(newRegion);
      setShowWarning(true);
      sessionStorage.setItem('region_switch_warned', 'true');
    } else {
      setRegion(newRegion);
    }
  };

  const confirmSwitch = () => {
    if (pendingRegion) {
      setRegion(pendingRegion);
      setPendingRegion(null);
    }
    setShowWarning(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        <Button
          size="sm"
          variant={region === 'us' ? 'default' : 'ghost'}
          onClick={() => handleRegionChange('us')}
          className="gap-2"
        >
          <Globe className="w-4 h-4" />
          Global
        </Button>
        <Button
          size="sm"
          variant={region === 'indian' ? 'default' : 'ghost'}
          onClick={() => handleRegionChange('indian')}
          className={`gap-2 ${region === 'indian' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
        >
          <MapPin className="w-4 h-4" />
          Indian
        </Button>
      </div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Switch Database Region?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to switch from <strong>{region === 'us' ? 'Global' : 'Indian'}</strong> to <strong>{pendingRegion === 'us' ? 'Global' : 'Indian'}</strong> database.</p>
              <p className="text-orange-600 font-semibold">⚠️ Warning: Your current search results and page data will be lost.</p>
              <p>You will be redirected to the {pendingRegion === 'indian' ? 'Indian' : 'Global'} home page.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRegion(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch} className={pendingRegion === 'indian' ? 'bg-orange-600 hover:bg-orange-700' : ''}>
              Switch to {pendingRegion === 'indian' ? 'Indian' : 'Global'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
