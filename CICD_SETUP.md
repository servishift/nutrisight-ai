# NutriSight AI — Complete Setup Guide
# Docker Hub + Neon DB Migration + AWS Deployment + CI/CD

---

## IMPORTANT SECURITY NOTE

Your Docker Hub token has been shared in chat. **Regenerate it immediately:**
1. Go to https://hub.docker.com → Account Settings → Security
2. Delete the token named `github ci cd`
3. Create a new one and add it to GitHub Secrets as `DOCKERHUB_TOKEN`

---

## PART 1 — What Data Goes Where

### ✅ Migrate to Neon DB (project runtime data — loaded by the app)

| File | Used By | Table Name |
|------|---------|------------|
| `backend/dataset/Food_Ingredient_Intelligence_Database.csv` | `data_loader.py`, `frequency_analyzer.py`, `graph_intelligence.py` | `food_ingredients` |
| `backend/app/data/additives_production.json` | `additive_engine.py` | `additives` |
| `backend/indian_data/indian_foods_master.csv` | `indian_food_service.py` | `indian_foods` |
| `backend/indian_data/clustered_foods.csv` | `indian_food_service.py` | `indian_foods_clustered` |
| `backend/diet_recommendation_dataset/diet_recommendation_dataset.csv` | diet engine | `diet_recommendations` |
| `backend/diet_recommendation_dataset/disease_diet_rules.csv` | diet engine | `disease_diet_rules` |
| `backend/diet_recommendation_dataset/disease_nutrition_rules.csv` | diet engine | `disease_nutrition_rules` |
| `backend/diet_recommendation_dataset/meal_planning_dataset.csv` | diet engine | `meal_plans` |
| `backend/diet_recommendation_dataset/oxalate_dataset.csv` | diet engine | `oxalate_data` |
| `backend/models/nutrition_database.csv` | `data_loader.py` (fallback) | `nutrition_database` |

### 🔒 Keep on Local PC Only (ML training data — NOT in git, NOT in Neon)

| File/Folder | Used By Model | Model Output |
|-------------|--------------|--------------|
| `backend/dataset/FoodData_Central_csv_2025-12-18/` | `train_phase3_simple.py` | `models/similarity_tfidf.pkl`, `models/brand_prediction_tfidf.pkl` |
| `backend/dataset/Food_Ingredient_Intelligence_Database.csv` | `train_model.py`, `train_nutrition_model.py` | `models/vectorizer.pkl`, `models/classifier.pkl` |
| `backend/ml/nutrition_training_data_*.csv` | `train_ingredient_nutrition_model.py` | `models/food_vectors.pkl`, `models/ingredient_vectorizer.pkl` |
| `backend/dataset/processed/nutrition_training_data_*.csv` | `train_phase3_simple.py` | `models/similarity_tfidf.pkl` |
| `backend/indian_data/Indian_Food_Nutrition_Processed.csv` | `train_indian_models.py` | `indian_data/models/*.pkl` |
| `backend/dataset/Anuvaad_INDB_2024.11.xlsx` | `process_indian_data.py` → `train_indian_models.py` | `indian_data/models/*.pkl` |
| `backend/diet_recommendation_dataset/ml_food_features.csv` | `scripts/train_diet_recommender.py` | `models/diet_*.pkl` |
| `backend/diet_recommendation_dataset/master_indian_food_dataset.csv` | `scripts/train_diet_recommender.py` | `models/diet_*.pkl` |

### 🐳 Baked into Docker Image (model binaries — NOT in git)

```
backend/models/*.pkl          ← trained ML models
backend/indian_data/models/   ← Indian food ML models
```

---

## PART 2 — Neon DB Setup & Migration

### Step 1 — Create Neon DB

1. Go to https://neon.tech → Sign up free
2. Create project: `nutrisight-ai`
3. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2 — Add to GitHub Secrets

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | your Neon connection string |

### Step 3 — Add to backend/.env

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 4 — Run migration script (one time, from your local PC)

```bash
cd backend
pip install psycopg2-binary pandas sqlalchemy
python scripts/migrate_to_neon.py
```

---

## PART 3 — AWS Deployment (when you're ready)

### Option A — EC2 (cheapest, full control)

**Recommended instance:** `t3.medium` (2 vCPU, 4GB RAM) ~$30/month

```bash
# 1. Launch EC2 instance
#    - AMI: Ubuntu 22.04 LTS
#    - Instance type: t3.medium
#    - Security group: open port 80, 443, 22
#    - Key pair: download .pem file

# 2. SSH in
ssh -i nutrisight.pem ubuntu@YOUR_EC2_IP

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# 4. Create deploy directory
sudo mkdir -p /opt/nutrisight
sudo chown ubuntu:ubuntu /opt/nutrisight
cd /opt/nutrisight

# 5. Copy docker-compose.yml and backend/.env to server
# (do this from your local machine)
scp -i nutrisight.pem docker-compose.yml ubuntu@YOUR_EC2_IP:/opt/nutrisight/
scp -i nutrisight.pem backend/.env ubuntu@YOUR_EC2_IP:/opt/nutrisight/backend/.env

# 6. Start services
docker compose pull
docker compose up -d

# 7. Check
curl http://localhost/health
```

**Add to GitHub Secrets:**
| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | your EC2 public IP |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | contents of your .pem file |
| `DEPLOY_PATH` | `/opt/nutrisight` |

### Option B — ECS Fargate (serverless containers, no server management)

More complex setup — use EC2 first, migrate to ECS later when scaling.

### Add domain name later

```bash
# On EC2, install nginx + certbot for HTTPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then update GitHub Secret `DEPLOY_HOST` to your domain name.

---

## PART 4 — GitHub Push → Auto Docker Build Flow

```
You: git push origin main
         │
         ▼
GitHub Actions starts:
  1. frontend-ci    → npm ci + tsc + build
  2. backend-ci     → pip install + flake8 + pytest
         │ (both pass)
         ▼
  3. docker-build   → builds frontend + backend images
                    → pushes to Docker Hub:
                       ashishjaiswal222/nutrisight-frontend:latest
                       ashishjaiswal222/nutrisight-frontend:<git-sha>
                       ashishjaiswal222/nutrisight-backend:latest
                       ashishjaiswal222/nutrisight-backend:<git-sha>
         │
         ▼
  4. deploy (SSH)   → pulls new images on server
                    → restarts backend (waits for health)
                    → restarts frontend
         │
         ▼
  5. health-check   → GET /health → must return 200
                    → GET /       → must return 200
         │
         ▼
  6. notify         → Discord message ✅ or ❌
```

### For now (no server yet) — pipeline runs steps 1-3 only

Steps 4-6 will be skipped until you add `DEPLOY_HOST` secret.
The Docker images will still be built and pushed to Docker Hub automatically.

---

## PART 5 — ML Model Retrain → Auto Deploy Flow

When you retrain models on your local PC:

```bash
# 1. Retrain on local PC
cd backend
python train_phase3_simple.py        # updates models/similarity_tfidf.pkl
python train_indian_models.py        # updates indian_data/models/*.pkl
python scripts/train_diet_recommender.py  # updates models/diet_*.pkl

# 2. Commit ONLY the model files (not training data)
git add backend/models/*.pkl backend/indian_data/models/*.pkl
git commit -m "ml: retrain similarity + indian models"
git push origin main

# 3. GitHub Actions auto-builds new Docker image with updated models
# 4. Auto-deploys to server
```

**Note:** .pkl files are in .gitignore by default.
To allow model files in git, add this to .gitignore:
```
# Allow model binaries (small enough for git)
!backend/models/*.pkl
!backend/indian_data/models/*.pkl
```

---

## PART 6 — Files to Keep on Local PC (Never Delete)

### ML Training Datasets (keep forever)
```
backend/dataset/FoodData_Central_csv_2025-12-18/   ← 3GB+ FDC dataset
backend/dataset/Anuvaad_INDB_2024.11.xlsx          ← Indian nutrition DB
backend/dataset/Food_Ingredient_Intelligence_Database.csv
backend/ml/nutrition_training_data_*.csv
backend/dataset/processed/nutrition_training_data_*.csv
backend/indian_data/Indian_Food_Nutrition_Processed.csv
backend/diet_recommendation_dataset/ml_food_features.csv
backend/diet_recommendation_dataset/master_indian_food_dataset.csv
```

### Training Scripts (keep in git)
```
backend/train_phase3_simple.py
backend/train_indian_models.py
backend/train_model.py
backend/train_nutrition_model.py
backend/scripts/train_diet_recommender.py
backend/ml/train_ingredient_nutrition_model.py
backend/process_indian_data.py
```

### Model → Dataset Mapping
| Model File | Training Dataset | Retrain Script |
|-----------|-----------------|----------------|
| `models/similarity_tfidf.pkl` | `FoodData_Central_csv_2025-12-18/` | `train_phase3_simple.py` |
| `models/brand_prediction_tfidf.pkl` | `FoodData_Central_csv_2025-12-18/` | `train_phase3_simple.py` |
| `models/vectorizer.pkl` + `classifier.pkl` | `Food_Ingredient_Intelligence_Database.csv` | `train_model.py` |
| `models/food_vectors.pkl` + `ingredient_vectorizer.pkl` | `ml/nutrition_training_data_*.csv` | `ml/train_ingredient_nutrition_model.py` |
| `models/diet_*.pkl` | `diet_recommendation_dataset/ml_food_features.csv` | `scripts/train_diet_recommender.py` |
| `indian_data/models/calorie_predictor.pkl` | `Anuvaad_INDB_2024.11.xlsx` | `train_indian_models.py` |
| `indian_data/models/category_predictor.pkl` | `Anuvaad_INDB_2024.11.xlsx` | `train_indian_models.py` |
| `indian_data/models/health_*.pkl` | `Anuvaad_INDB_2024.11.xlsx` | `train_indian_models.py` |
| `indian_data/models/nutrient_clusterer.pkl` | `Anuvaad_INDB_2024.11.xlsx` | `train_indian_models.py` |
