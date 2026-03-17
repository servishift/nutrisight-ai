const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function authHeaders(): HeadersInit {
  const stored = localStorage.getItem('foodintel_auth_tokens');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed?.accessToken
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${parsed.accessToken}` }
    : { 'Content-Type': 'application/json' };
}

export const indianFoodAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE}/api/indian/stats`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE}/api/indian/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  search: async (query: string, limit = 20) => {
    const response = await fetch(`${API_BASE}/api/indian/search?q=${encodeURIComponent(query)}&limit=${limit}`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Failed to search foods');
    return response.json();
  },

  getFood: async (foodName: string) => {
    const response = await fetch(`${API_BASE}/api/indian/food/${encodeURIComponent(foodName)}`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Food not found');
    return response.json();
  },

  getCategoryFoods: async (category: string, limit = 50) => {
    const response = await fetch(`${API_BASE}/api/indian/category/${encodeURIComponent(category)}?limit=${limit}`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Failed to fetch category foods');
    return response.json();
  },

  predictCalories: async (nutrients: Record<string, number>) => {
    const response = await fetch(`${API_BASE}/api/indian/predict/calories`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(nutrients),
    });
    if (!response.ok) throw new Error('Failed to predict calories');
    return response.json();
  },

  predictHealth: async (nutrients: Record<string, number>) => {
    const response = await fetch(`${API_BASE}/api/indian/predict/health`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(nutrients),
    });
    if (!response.ok) throw new Error('Failed to predict health labels');
    return response.json();
  },

  findSimilar: async (nutrients: Record<string, number>, topN = 5) => {
    const response = await fetch(`${API_BASE}/api/indian/similar?top_n=${topN}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(nutrients),
    });
    if (!response.ok) throw new Error('Failed to find similar foods');
    return response.json();
  },

  analyze: async (foodName: string, nutrients: Record<string, number>) => {
    const response = await fetch(`${API_BASE}/api/analyze/indian`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ food_name: foodName, nutrients }),
    });
    if (!response.ok) throw new Error('Failed to analyze food');
    return response.json();
  },
};
