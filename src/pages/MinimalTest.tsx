import { useRegion } from '@/contexts/RegionContext';
import { Button } from '@/components/ui/button';

export default function MinimalTest() {
  const { region, isIndian, setRegion } = useRegion();
  
  console.log('🎨 MinimalTest rendering - region:', region, 'isIndian:', isIndian);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Minimal Region Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <div>Region: <strong>{region}</strong></div>
        <div>isIndian: <strong>{String(isIndian)}</strong></div>
        <div>localStorage: <strong>{localStorage.getItem('nutrisight_region')}</strong></div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => {
          console.log('Clicking US button');
          setRegion('us');
        }}>
          Set US
        </Button>
        <Button onClick={() => {
          console.log('Clicking Indian button');
          setRegion('indian');
        }}>
          Set Indian
        </Button>
      </div>

      <div className={`mt-4 p-4 rounded ${isIndian ? 'bg-orange-200' : 'bg-blue-200'}`}>
        <h2 className={`text-xl ${isIndian ? 'text-orange-800' : 'text-blue-800'}`}>
          {isIndian ? '🇮🇳 INDIAN MODE' : '🌍 GLOBAL MODE'}
        </h2>
        <p>This box should change color when you click the buttons above.</p>
      </div>
    </div>
  );
}
