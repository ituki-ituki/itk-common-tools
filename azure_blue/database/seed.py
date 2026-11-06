import csv
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "backend"))
from db import DB, connect, load


def rows(table: str) -> list[dict]:
    path = DB.parent / f"{table}.csv"
    path = path if path.exists() else HERE / f"{table}.csv"
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "cp932"):
        try:
            return list(csv.DictReader(raw.decode(enc).splitlines()))
        except UnicodeDecodeError:
            pass
    raise SystemExit(f"{path}: 文字コードが読めません")


DB.parent.mkdir(exist_ok=True)
con = connect()
con.executescript((HERE / "schema.sql").read_text())
for table in ("wines", "suppliers"):
    load(con, table, rows(table))
con.commit()
print({t: con.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in ("wines", "suppliers", "learned")})
