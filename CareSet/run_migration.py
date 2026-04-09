import os
import re
import psycopg2
from psycopg2.extras import DictCursor, execute_values
from dotenv import load_dotenv
import sys

# Add the current directory to path so we can import from database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database.models import init_db

load_dotenv()

# Source and Target Configuration
SOURCE_URL = "postgresql://neondb_owner:npg_u10ghRdEbnZM@ep-delicate-dust-afdhrfwf.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
# Extract local URL, remove search_path options for standard psycopg2 connection
local_env_url = os.environ.get('DATABASE_URL', "postgresql://postgres:1234@localhost:5432/careflow1?options=-csearch_path%3Dcareset")
TARGET_URL = re.sub(r'\?options=.*$', '', local_env_url)

TARGET_SCHEMA = 'careset'

# Ordered list of tables to migrate based on foreign key dependencies
# Excluded: users, user_sessions (relies on unified SSO system)
TABLES_ORDER = [
    'buildings',
    'mqtt_config',
    'floors',
    'gateways',
    'beacons',
    'focus_areas',
    'gateway_plans',
    'zones',
    'planned_gateways',
    'coverage_zones',
    'alert_zones',
    'rssi_signals',
    'positions',
    'calibration_points',
    'zone_alerts'
]

def get_db_connections():
    source_conn = psycopg2.connect(SOURCE_URL)
    target_conn = psycopg2.connect(TARGET_URL)
    return source_conn, target_conn

def migrate_table(source_cur, target_cur, table_name, batch_size=1000):
    print(f"\n--- Migrating {table_name} ---")
    
    # Check if table exists in source
    source_cur.execute(f"SELECT COUNT(*) FROM public.{table_name}")
    total_rows = source_cur.fetchone()[0]
    print(f"[{table_name}] Found {total_rows} rows in source DB.")
    
    if total_rows == 0:
        return 0, 0
    
    # Get column names dynamically from source
    source_cur.execute(f"SELECT * FROM public.{table_name} LIMIT 0")
    source_columns = [desc[0] for desc in source_cur.description]
    
    # Get column names from target
    target_cur.execute(f"SELECT * FROM {TARGET_SCHEMA}.{table_name} LIMIT 0")
    target_columns = [desc[0] for desc in target_cur.description]
    
    columns = [c for c in source_columns if c in target_columns]
    col_names = ", ".join(columns)
    
    # Create the DO UPDATE SET clause for idempotency (excluding 'id')
    update_clause = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns if col != 'id'])
    
    # In case there's no other column beside 'id', DO NOTHING
    if not update_clause:
        on_conflict = "ON CONFLICT (id) DO NOTHING"
    else:
        on_conflict = f"ON CONFLICT (id) DO UPDATE SET {update_clause}"

    insert_query = f"""
        INSERT INTO {TARGET_SCHEMA}.{table_name} ({col_names}) 
        VALUES %s 
        {on_conflict}
    """

    # Fetch data from source
    source_cur.execute(f"SELECT {col_names} FROM public.{table_name}")
    
    inserted_count = 0
    skipped_count = 0
    
    while True:
        records = source_cur.fetchmany(batch_size)
        if not records:
            break
            
        try:
            # We don't have to keep track of inserted vs updated count directly with execute_values easily,
            # but we can assume safe execution if it doesn't fail.
            execute_values(target_cur, insert_query, records)
            inserted_count += len(records)
        except Exception as e:
            # If batch fails due to some obscure error, we might want to try row-by-row to skip bad ones
            print(f"[{table_name}] Batch insert failed: {e}. Falling back to row-by-row...")
            target_cur.connection.rollback()
            for record in records:
                try:
                    execute_values(target_cur, insert_query, [record])
                    inserted_count += 1
                except Exception as row_error:
                    print(f"[{table_name}] Skip row ID {record[0]}. Error: {row_error}")
                    target_cur.connection.rollback()
                    skipped_count += 1
                    
    target_cur.connection.commit()
    print(f"[{table_name}] Successfully processed {inserted_count} rows. Skipped: {skipped_count}.")
    
    return inserted_count, skipped_count

def verify_migration(source_cur, target_cur):
    print("\n--- Verification Summary ---")
    print(f"{'Table':<20} | {'Source Rows':<15} | {'Target Rows':<15} | {'Status'}")
    print("-" * 75)
    
    all_good = True
    for table in TABLES_ORDER:
        source_cur.execute(f"SELECT COUNT(*) FROM public.{table}")
        source_count = source_cur.fetchone()[0]
        
        target_cur.execute(f"SELECT COUNT(*) FROM {TARGET_SCHEMA}.{table}")
        target_count = target_cur.fetchone()[0]
        
        status = "✅ OK" if source_count == target_count else "❌ MISMATCH"
        if source_count != target_count:
            all_good = False
            
        print(f"{table:<20} | {source_count:<15} | {target_count:<15} | {status}")
    
    return all_good

def main():
    print("Starting Data Migration...")
    try:
        print("Initializing Local database schema...")
        init_db()
        print("Schema initialized.")
        
        source_conn, target_conn = get_db_connections()
        
        # Ensure correct schema path on target connection
        with target_conn.cursor() as cur:
            cur.execute(f"SET search_path TO {TARGET_SCHEMA}")
        target_conn.commit()

        # Migrate each table in dependency order
        with source_conn.cursor(cursor_factory=DictCursor) as source_cur:
            with target_conn.cursor() as target_cur:
                for table in TABLES_ORDER:
                    migrate_table(source_cur, target_cur, table)
                    
        # Verification step
        print("\nVerifying Data Transfer...")
        with source_conn.cursor() as source_cur:
            with target_conn.cursor() as target_cur:
                success = verify_migration(source_cur, target_cur)

        if success:
            print("\n✅ Migration completed successfully! Data integrity preserved.")
        else:
            print("\n⚠️ Migration finished with row count mismatches. Check logs above.")

    except Exception as e:
        print(f"Migration Failed: {e}")
    finally:
        if 'source_conn' in locals() and source_conn:
            source_conn.close()
        if 'target_conn' in locals() and target_conn:
            target_conn.close()

if __name__ == "__main__":
    main()
