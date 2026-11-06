import re
import sqlite3
from contextlib import closing, contextmanager
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parents[1]
DB = ROOT / "data" / "db.sqlite"
KANA = str.maketrans({"ヴ": "ブ", "ー": None, "・": None, "ッ": "ツ"})


@contextmanager
def connect():
    with closing(sqlite3.connect(DB, timeout=10)) as con, con:
        con.row_factory = sqlite3.Row
        yield con


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower().translate(KANA)
    return re.sub(r"[\s\-_,.()'\"*/]", "", text)


def search(con: sqlite3.Connection, table: str, text: str, limit: int = 10) -> list[str]:
    key = norm(text)
    grams = {key[i : i + 3] for i in range(len(key) - 2)}
    if not grams:
        return []
    query = " OR ".join('"' + g.replace('"', "") + '"' for g in grams)
    rows = con.execute(f"SELECT code FROM {table}_keys WHERE {table}_keys MATCH ? ORDER BY rank LIMIT ?", (query, limit))
    return [r["code"] for r in rows]


def load(con: sqlite3.Connection, table: str, rows: list[dict]) -> None:
    cols = list(rows[0])
    con.executemany(f"INSERT OR REPLACE INTO {table} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", [list(r.values()) for r in rows])
    con.executemany(f"DELETE FROM {table}_keys WHERE code = ?", [(r["code"],) for r in rows])
    con.executemany(f"INSERT INTO {table}_keys (key, code) VALUES (?, ?)", [(norm(r["name"]), r["code"]) for r in rows])
