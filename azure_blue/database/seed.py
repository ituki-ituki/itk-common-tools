import csv
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "backend"))
from db import DB, connect, load

DB.parent.mkdir(exist_ok=True)
con = connect()
con.executescript((HERE / "schema.sql").read_text())
for table in ("wines", "suppliers"):
    with open(HERE / f"{table}.csv", encoding="utf-8") as f:
        load(con, table, list(csv.DictReader(f)))
con.commit()
print({t: con.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in ("wines", "suppliers", "learned")})
