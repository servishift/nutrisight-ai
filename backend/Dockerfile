# ============================================================
# NutriSight AI - Backend Production Dockerfile
# Flask + Gunicorn + ML Models (scikit-learn, pandas, numpy)
# ============================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    # Tells the app where to find models inside the container
    MODEL_DIR=/app/models

WORKDIR /app

# Install only the OS-level packages needed to compile ML deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cached unless requirements change)
COPY requirements.prod.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.prod.txt

# Copy application source code
COPY app/ ./app/
COPY gunicorn_config.py .

# Copy ML models — these are the trained .pkl files needed for inference.
# We copy them into the image so the container is fully self-contained.
# Duplicate timestamped files are excluded via .dockerignore.
COPY models/ ./models/

# Copy full FDC ingredient intelligence dataset.
# Required by frequency_analyzer and graph_intelligence at runtime.
# Excluded from image previously — now included for production data quality.
COPY dataset/Food_Ingredient_Intelligence_Database.csv ./dataset/

# Copy diet dataset — required by the diet recommendation engine at runtime
COPY diet_recommendation_dataset/ ./diet_recommendation_dataset/

# Copy Indian food ML models and runtime data — required by Indian region API
COPY indian_data/models/ ./indian_data/models/
COPY indian_data/indian_foods_master.csv ./indian_data/
COPY indian_data/clustered_foods.csv ./indian_data/

# Create the logs directory the gunicorn config writes to
RUN mkdir -p logs

EXPOSE 5000

# Health check — waits 60s for ML models to load before first check
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# app.main uses create_app() factory — gunicorn needs the callable form
CMD ["gunicorn", "-c", "gunicorn_config.py", "app.main:create_app()"]
