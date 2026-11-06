import csv
import sqlite3
from pathlib import Path

here = Path(__file__).parent
schema = """
CREATE TABLE wines(id INTEGER PRIMARY KEY, producer TEXT, name TEXT, vintage INTEGER, color TEXT);
CREATE TABLE buys(id INTEGER PRIMARY KEY, date TEXT, wine INTEGER REFERENCES wines, qty INTEGER, cost INTEGER, supplier TEXT);
CREATE TABLE sales(id INTEGER PRIMARY KEY, date TEXT, wine INTEGER REFERENCES wines, qty INTEGER, price INTEGER, client TEXT);
"""
path = here / "db.sqlite"
path.unlink(missing_ok=True)
db = sqlite3.connect(path)
db.executescript(schema)
for table in ("wines", "buys", "sales"):
    with open(here / "master" / f"{table}.csv", encoding="utf-8") as f:
        data = list(csv.DictReader(f))
    cols = list(data[0])
    sql = f"INSERT INTO {table}({','.join(cols)}) VALUES({','.join('?' * len(cols))})"
    db.executemany(sql, [list(r.values()) for r in data])
    print(table, len(data))
db.commit()
