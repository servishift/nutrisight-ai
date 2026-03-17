"""
Gunicorn Production Configuration
Usage: gunicorn -c gunicorn_config.py app.main:app
"""
import multiprocessing
import os

# ── Binding ────────────────────────────────────────────────
bind = "0.0.0.0:5000"
backlog = 1024

# ── Workers ────────────────────────────────────────────────
# ML models are large (~1GB loaded in memory).
# Cap at 4 workers to avoid OOM; each worker loads its own copy.
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)
worker_class = "sync"
worker_connections = 1000
timeout = 120        # ML inference can take up to 30s
keepalive = 5
graceful_timeout = 30

# ── Logging — write to stdout/stderr for Docker log collection
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'

# ── Process ────────────────────────────────────────────────
proc_name = "nutrisight-api"
daemon = False

# ── Performance ────────────────────────────────────────────
# preload_app=True loads ML models once in the master process,
# then workers fork — saving memory and startup time.
preload_app = True
max_requests = 1000
max_requests_jitter = 100

def on_starting(server):
    print("=" * 50)
    print("NutriSight AI — Starting Production Server")
    print(f"  Workers : {workers}")
    print(f"  Bind    : {bind}")
    print(f"  Timeout : {timeout}s")
    print("=" * 50)

def when_ready(server):
    print("Server ready — accepting connections.")
