# ============================================================
# NutriSight AI - Backend Production Dockerfile
# Data is loaded from Neon DB at runtime.
# ML models (.pkl) are copied from local build context.
# ============================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    MODEL_DIR=/app/models

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (layer-cached)
COPY requirements.prod.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.prod.txt

# Copy application source
COPY app/ ./app/
COPY gunicorn_config.py .
COPY run.py .

# Copy ML model binaries
# These are trained locally and must exist before docker build
COPY models/ ./models/

# Copy Indian food ML models
COPY indian_data/models/ ./indian_data/models/

# Logs dir
RUN mkdir -p logs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["gunicorn", "-c", "gunicorn_config.py", "app.main:create_app()"]
