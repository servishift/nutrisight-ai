const INDIAN_KEYWORDS = [
  'paneer', 'dal', 'daal', 'roti', 'chapati', 'naan', 'paratha', 'dosa', 'idli',
  'biryani', 'pulao', 'samosa', 'pakora', 'pakoda', 'vada', 'bhaji',
  'curry', 'masala', 'tandoori', 'tikka', 'korma',
  'raita', 'lassi', 'chai', 'kulfi', 'gulab jamun', 'jalebi', 'ladoo',
  'aloo', 'gobi', 'palak', 'bhindi', 'baingan',
  'chana', 'rajma', 'moong', 'masoor',
  'ghee', 'chaat', 'bhel', 'pav bhaji',
  'poha', 'upma', 'uttapam',
  'halwa', 'kheer', 'papad', 'pickle', 'achaar', 'chutney',
  'dhokla', 'thepla', 'puri', 'keema', 'kebab', 'besan', 'atta'
];

export const detectFoodOrigin = (text: string): 'indian' | 'us' => {
  const lowerText = text.toLowerCase();
  
  const hasIndianKeyword = INDIAN_KEYWORDS.some(keyword => 
    lowerText.includes(keyword)
  );
  
  const hasHindiChars = /[\u0900-\u097F]/.test(text);
  
  if (hasIndianKeyword || hasHindiChars) {
    return 'indian';
  }
  
  return 'us';
};

export const getValidationMessage = (input: string, currentRegion: 'us' | 'indian'): string | null => {
  const detectedOrigin = detectFoodOrigin(input);
  
  if (currentRegion === 'us' && detectedOrigin === 'indian') {
    return '🇮🇳 This appears to be an Indian food. Switch to Indian mode for accurate results.';
  }
  
  if (currentRegion === 'indian' && detectedOrigin === 'us') {
    return '🌍 This appears to be a global food. Switch to Global mode for better analysis.';
  }
  
  return null;
};
