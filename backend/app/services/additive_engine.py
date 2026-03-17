"""
Additive Detection Engine
Loads additive database from Neon DB (falls back to JSON file).
"""
import os
import json
import re
from pathlib import Path
from functools import lru_cache


def _get_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    try:
        from sqlalchemy import create_engine
        return create_engine(url, connect_args={"sslmode": "require"}, pool_pre_ping=True)
    except Exception as e:
        print(f"[AdditiveEngine] DB engine error: {e}")
        return None


@lru_cache(maxsize=1)
def _load_additives():
    engine = _get_engine()
    if engine:
        try:
            import pandas as pd
            df = pd.read_sql_table("additives", engine)
            records = df.to_dict("records")
            print(f"[AdditiveEngine] Loaded {len(records)} additives from Neon")
            return records
        except Exception as e:
            print(f"[AdditiveEngine] Neon read failed: {e}")

    # Fallback to JSON
    json_path = Path(__file__).parent.parent / "data" / "additives_production.json"
    try:
        with open(json_path) as f:
            data = json.load(f)
        print(f"[AdditiveEngine] Loaded {len(data)} additives from JSON fallback")
        return data
    except FileNotFoundError:
        print("[AdditiveEngine] WARNING: No additive database found")
        return []


ADDITIVE_DATABASE = _load_additives()


def detect_additives(ingredient_text):
    text_lower = ingredient_text.lower()
    detected = []
    detected_names = set()
    for additive in ADDITIVE_DATABASE:
        name_lower = additive["name"].lower()
        if name_lower in text_lower and name_lower not in detected_names:
            detected.append({
                "name":      additive["name"],
                "type":      additive.get("type", "unknown"),
                "riskLevel": additive.get("risk", additive.get("riskLevel", "low")),
                "frequency": additive.get("frequency", 0),
            })
            detected_names.add(name_lower)
    return detected


def get_all_additives():
    return ADDITIVE_DATABASE


def get_additives_by_type(additive_type=None):
    if not additive_type or additive_type.lower() == "all":
        return ADDITIVE_DATABASE
    return [a for a in ADDITIVE_DATABASE if a.get("type", "").lower() == additive_type.lower()]


def get_additive_stats():
    return {
        "total": len(ADDITIVE_DATABASE),
        "by_risk": {
            "high":   len([a for a in ADDITIVE_DATABASE if a.get("risk", a.get("riskLevel")) == "high"]),
            "medium": len([a for a in ADDITIVE_DATABASE if a.get("risk", a.get("riskLevel")) == "medium"]),
            "low":    len([a for a in ADDITIVE_DATABASE if a.get("risk", a.get("riskLevel")) == "low"]),
        },
        "by_type": {},
    }
