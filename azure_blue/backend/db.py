import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parents[1]
DB = ROOT / "data" / "db.sqlite"
KANA = str.maketrans({"ヴ": "ブ", "ー": None, "・": None, "ッ": "ツ"})


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


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
    con.executemany(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", [list(r.values()) for r in rows])
    con.executemany(f"INSERT INTO {table}_keys (key, code) VALUES (?, ?)", [(norm(r["name"]), r["code"]) for r in rows])
