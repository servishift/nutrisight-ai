# Phase 3 — Deep Learning API Reference

All Phase 3 endpoints require `Authorization: Bearer <accessToken>` header.

Base URL: `VITE_API_BASE_URL` (e.g. `http://localhost:5000`)

---

## 1. Similarity Search

### `POST /api/similar-products`

Find products with similar ingredient profiles using BERT embeddings.

**Request:**
```json
{
  "ingredientText": "Whole Wheat Flour, Sugar, Palm Oil, Cocoa Powder",
  "topK": 5
}
```

**Response `200`:**
```json
{
  "query": "Whole Wheat Flour, Sugar, Palm Oil, Cocoa Powder",
  "modelUsed": "sentence-transformers/all-MiniLM-L6-v2",
  "searchTimeMs": 42,
  "results": [
    {
      "id": "prod-1234",
      "productName": "Organic Wheat Crackers",
      "brandOwner": "Nature Valley",
      "category": "Snacks",
      "similarityScore": 0.94,
      "ingredients": "Whole Wheat Flour, Sunflower Oil, Sea Salt",
      "cleanLabelScore": 85
    }
  ]
}
```

**Backend implementation notes:**
- Encode `ingredientText` with Sentence-BERT → 768-dim vector
- Compute cosine similarity against stored product embeddings
- Return top-K results sorted by similarity score
- Store embeddings in PostgreSQL with `pgvector` extension

---

## 2. Brand Prediction

### `POST /api/predict-brand`

Predict brand owner from ingredient list using BERT + multi-class classifier.

**Request:**
```json
{
  "ingredientText": "Enriched Wheat Flour, Sugar, Palm Oil, Cocoa, Soy Lecithin"
}
```

**Response `200`:**
```json
{
  "ingredientText": "Enriched Wheat Flour, Sugar, Palm Oil, Cocoa, Soy Lecithin",
  "modelUsed": "BERT-fine-tuned-brand-classifier",
  "inferenceTimeMs": 128,
  "predictions": [
    { "brand": "Nestlé", "confidence": 0.72 },
    { "brand": "General Mills", "confidence": 0.14 },
    { "brand": "Kellogg's", "confidence": 0.08 }
  ]
}
```

**Backend implementation notes:**
- Use BERT embeddings → Linear classifier (or fine-tuned head)
- Train on USDA FoodData Central `brand_owner` field
- Return top-5 predictions with confidence scores
- Model: fine-tuned `bert-base-uncased` or Sentence-BERT + sklearn

---

## 3. Reformulation Detection

### `POST /api/detect-reformulation`

Compare two ingredient lists to detect additions, removals, reordering, and modifications.

**Request:**
```json
{
  "originalIngredients": "Wheat Flour, Sugar, Palm Oil, Red 40, Yellow 5, Salt",
  "updatedIngredients": "Wheat Flour, Sunflower Oil, Sugar, Beet Juice, Turmeric Extract, Salt"
}
```

**Response `200`:**
```json
{
  "overallSimilarity": 0.72,
  "orderSimilarity": 0.65,
  "cosineSimilarity": 0.78,
  "originalIngredients": ["Wheat Flour", "Sugar", "Palm Oil", "Red 40", "Yellow 5", "Salt"],
  "updatedIngredients": ["Wheat Flour", "Sunflower Oil", "Sugar", "Beet Juice", "Turmeric Extract", "Salt"],
  "summary": "Moderate reformulation detected...",
  "changes": [
    {
      "type": "removed",
      "ingredient": "Red 40",
      "details": "Artificial color removed",
      "impact": "positive"
    },
    {
      "type": "added",
      "ingredient": "Beet Juice",
      "details": "Natural color alternative added",
      "impact": "positive"
    },
    {
      "type": "reordered",
      "ingredient": "Sugar",
      "details": "Moved from position 2 to position 3",
      "impact": "positive"
    }
  ]
}
```

**Backend implementation notes:**
- Parse both lists → compare sets for additions/removals
- Use Jaccard + cosine similarity on BERT embeddings for overall score
- Use Kendall tau / order correlation for order similarity
- Classify impact using additive risk database

---

## 4. Embedding Visualization

### `POST /api/embeddings/visualize`

Get t-SNE reduced embeddings for interactive scatter plot.

**Request:**
```json
{
  "category": "Snacks"
}
```
Send `null` or omit `category` for all products.

**Response `200`:**
```json
[
  {
    "id": "prod-1234",
    "productName": "Organic Wheat Crackers",
    "x": 23.45,
    "y": -12.67,
    "category": "Snacks",
    "cluster": 2
  }
]
```

**Backend implementation notes:**
- Pre-compute t-SNE reduction on all product embeddings (cache in DB)
- Cluster via K-Means (k=6-8 depending on category count)
- Optional: recompute on demand with UMAP for faster results
- Return 2D coordinates + cluster labels

---

## Database Tables (Phase 3)

```sql
-- Product embeddings (requires pgvector extension)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand_owner TEXT,
  ingredients TEXT NOT NULL,
  category TEXT,
  embedding vector(768) NOT NULL,
  clean_label_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- t-SNE cache
CREATE TABLE embedding_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES product_embeddings(id),
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  cluster INTEGER NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reformulation history
CREATE TABLE reformulation_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  original_ingredients TEXT NOT NULL,
  updated_ingredients TEXT NOT NULL,
  overall_similarity FLOAT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Python Dependencies

```txt
sentence-transformers==2.2.2
torch>=2.0
scikit-learn>=1.3
numpy>=1.24
psycopg2-binary>=2.9
pgvector>=0.2
```

---

## Quick Start (Backend)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(ingredient_text: str) -> np.ndarray:
    return model.encode(ingredient_text)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
```
