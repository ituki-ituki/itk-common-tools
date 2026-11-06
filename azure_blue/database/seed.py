import csv
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "backend"))
from db import DB, connect, load


COLS = {"wines": {"code": 0, "name": 1, "short": 3}, "suppliers": {"code": 0, "name": 1}}


def text(path: Path) -> str:
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "cp932", "shift_jis_2004"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    raise SystemExit(f"{path}: 文字コードが読めません")


def rows(table: str) -> list[dict]:
    found = [p for p in DB.parent.iterdir() if p.name.lower() == f"{table}.csv"]
    path = found[0] if found else HERE / f"{table}.csv"
    lines = text(path).splitlines()
    data = list(csv.reader(lines[1:], delimiter="\t" if "\t" in lines[0] else ","))
    return [{k: r[i].strip() if i < len(r) else "" for k, i in COLS[table].items()} for r in data if r and r[0].strip()]


DB.parent.mkdir(exist_ok=True)
with connect() as con:
    con.executescript((HERE / "schema.sql").read_text())
    for table in ("wines", "suppliers"):
        load(con, table, rows(table))
    print({t: con.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in ("wines", "suppliers", "learned")})
