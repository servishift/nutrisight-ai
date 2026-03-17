"""
NutriSight AI - Neon DB Migration Script
Run from backend/ directory:
    python scripts/migrate_to_neon.py
"""

import os
import sys
import json
import time
import pandas as pd
from pathlib import Path
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in backend/.env")
    sys.exit(1)

BASE = Path(__file__).parent.parent  # backend/

MIGRATIONS = [
    ("food_ingredients",        BASE / "dataset/Food_Ingredient_Intelligence_Database.csv",             2000),
    ("indian_foods",            BASE / "indian_data/indian_foods_master.csv",                           1000),
    ("indian_foods_clustered",  BASE / "indian_data/clustered_foods.csv",                               1000),
    ("nutrition_database",      BASE / "models/nutrition_database.csv",                                 3000),
    ("diet_recommendations",    BASE / "diet_recommendation_dataset/diet_recommendation_dataset.csv",   1000),
    ("disease_diet_rules",      BASE / "diet_recommendation_dataset/disease_diet_rules.csv",            1000),
    ("disease_nutrition_rules", BASE / "diet_recommendation_dataset/disease_nutrition_rules.csv",       1000),
    ("meal_plans",              BASE / "diet_recommendation_dataset/meal_planning_dataset.csv",         1000),
    ("oxalate_data",            BASE / "diet_recommendation_dataset/oxalate_dataset.csv",               1000),
]

ADDITIVES_JSON = BASE / "app/data/additives_production.json"


def get_engine():
    return create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require", "connect_timeout": 30},
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=0,
    )


def test_connection(engine):
    print("Testing Neon DB connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print("  Connected: PostgreSQL 17 on Neon")
        return True
    except Exception as e:
        print("  FAILED: {}".format(e))
        return False


def drop_table(engine, table_name):
    with engine.connect() as conn:
        conn.execute(text('DROP TABLE IF EXISTS "{}" CASCADE'.format(table_name)))
        conn.commit()


def migrate_csv(engine, table_name, csv_path, chunksize=2000):
    if not csv_path.exists():
        print("  SKIP  {:30s} - file not found".format(table_name))
        return 0

    file_size_mb = csv_path.stat().st_size / (1024 * 1024)
    print("\n  Migrating : {}".format(table_name))
    print("  File      : {} ({:.1f} MB)".format(csv_path.name, file_size_mb))

    drop_table(engine, table_name)

    total = 0
    first_chunk = True
    start = time.time()

    for chunk in pd.read_csv(csv_path, chunksize=chunksize, low_memory=False):
        chunk.columns = [
            c.strip().lower()
             .replace(" ", "_").replace("-", "_")
             .replace("(", "").replace(")", "")
            for c in chunk.columns
        ]
        chunk = chunk.dropna(axis=1, how="all")

        chunk.to_sql(
            table_name,
            engine,
            if_exists="replace" if first_chunk else "append",
            index=False,
            method="multi",
        )
        total += len(chunk)
        first_chunk = False
        sys.stdout.write("  Rows      : {:,}  ({:.1f}s)\r".format(total, time.time() - start))
        sys.stdout.flush()

    elapsed = time.time() - start
    print("  Rows      : {:,}  ({:.1f}s)  DONE".format(total, elapsed))
    return total


def migrate_additives_json(engine, json_path):
    if not json_path.exists():
        print("  SKIP  additives - file not found")
        return 0

    print("\n  Migrating : additives")
    print("  File      : {}".format(json_path.name))

    with open(json_path) as f:
        data = json.load(f)

    df = pd.json_normalize(data)
    df.columns = [c.lower().replace(" ", "_").replace(".", "_") for c in df.columns]

    drop_table(engine, "additives")
    df.to_sql("additives", engine, if_exists="replace", index=False, method="multi")
    print("  Rows      : {:,}  DONE".format(len(df)))
    return len(df)


def verify_tables(engine):
    print("\n  Tables in Neon DB:")
    insp = inspect(engine)
    tables = insp.get_table_names()
    for t in sorted(tables):
        with engine.connect() as conn:
            count = conn.execute(text('SELECT COUNT(*) FROM "{}"'.format(t))).scalar()
        print("    {:35s} {:>8,} rows".format(t, count))


def main():
    print("=" * 60)
    print("  NutriSight AI - Neon DB Migration")
    print("=" * 60)

    engine = get_engine()

    if not test_connection(engine):
        sys.exit(1)

    total_rows = 0
    grand_start = time.time()

    for table_name, csv_path, chunksize in MIGRATIONS:
        rows = migrate_csv(engine, table_name, csv_path, chunksize)
        total_rows += rows

    rows = migrate_additives_json(engine, ADDITIVES_JSON)
    total_rows += rows

    print("\n" + "=" * 60)
    verify_tables(engine)

    elapsed = time.time() - grand_start
    print("\n" + "=" * 60)
    print("  Migration complete in {:.1f}s".format(elapsed))
    print("  Total rows inserted: {:,}".format(total_rows))
    print("=" * 60)


if __name__ == "__main__":
    main()
