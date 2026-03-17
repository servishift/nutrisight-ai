import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type Region = 'us' | 'indian';

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  isIndian: boolean;
  isUS: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegionState] = useState<Region>(() => {
    const saved = localStorage.getItem('nutrisight_region');
    return (saved as Region) || 'us';
  });
  const [renderKey, setRenderKey] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<Region | null>(null);

  const setRegion = (newRegion: Region) => {
    if (newRegion === region) return;
    
    console.log('🔄 Switching region:', region, '->', newRegion);
    setRegionState(newRegion);
    localStorage.setItem('nutrisight_region', newRegion);
    setRenderKey(prev => prev + 1);
    console.log('✅ Region switched to:', newRegion);
    
    // Redirect based on region
    const currentPath = window.location.pathname;
    if (newRegion === 'indian' && !currentPath.startsWith('/indian')) {
      window.location.href = '/indian';
    } else if (newRegion === 'us' && currentPath.startsWith('/indian')) {
      window.location.href = '/';
    }
  };

  useEffect(() => {
    console.log('🌍 Region changed:', region, '| isIndian:', region === 'indian');
    document.documentElement.setAttribute('data-region', region);
  }, [region]);

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion,
        isIndian: region === 'indian',
        isUS: region === 'us',
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return context;
};
