import psycopg2
from psycopg2.extras import RealDictCursor

REMOTE_URL = "postgresql://neondb_owner:npg_u10ghRdEbnZM@ep-delicate-dust-afdhrfwf.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

def inspect():
    try:
        conn = psycopg2.connect(REMOTE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # List schemas
        cur.execute("SELECT schema_name FROM information_schema.schemata;")
        schemas = [r['schema_name'] for r in cur.fetchall()]
        print(f"Schemas: {schemas}")
        
        # Use careset schema if it exists, otherwise public
        schema_to_use = 'careset' if 'careset' in schemas else 'public'
        print(f"Using schema: {schema_to_use}")
        
        # List tables in the schema
        cur.execute(f"""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '{schema_to_use}' 
            AND table_type = 'BASE TABLE';
        """)
        tables = [r['table_name'] for r in cur.fetchall()]
        print(f"Tables in {schema_to_use}: {tables}")
        
        # Get Foreign Keys
        cur.execute(f"""
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='{schema_to_use}';
        """)
        fks = cur.fetchall()
        print("\nForeign Keys:")
        for fk in fks:
            print(f"{fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
