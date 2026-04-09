import os
import sys
from pathlib import Path

# Add the current directory to sys.path to find database and utils
sys.path.append(str(Path("c:/Users/ADMIN/Downloads/careflow/CareSet").absolute()))

from database import init_db
from utils.auth import ensure_demo_user

if __name__ == "__main__":
    try:
        print("Initializing database...")
        init_db()
        print("Ensuring demo user...")
        ensure_demo_user()
        print("CareSet seeding complete!")
    except Exception as e:
        print(f"CareSet seeding failed: {e}")
        sys.exit(1)
