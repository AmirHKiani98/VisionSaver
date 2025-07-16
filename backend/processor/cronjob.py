import sqlite3
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

sqlite3_path = BASE_DIR / 'db.sqlite3'
if not sqlite3_path.exists():
    raise FileNotFoundError(f"SQLite database file not found at: {sqlite3_path}")

conn = sqlite3.connect(sqlite3_path)
while True:
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        if tables:
            print("Database is accessible. Tables found:", tables)
            break
        else:
            print("No tables found in the database.")
            break
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        break
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        break