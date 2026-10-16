import re
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

DIR = Path(__file__).parent
DB = DIR / "data" / "health.db"
FILES = {"index.html", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"}
app = FastAPI()


class Patch(BaseModel):
    morning: float | None = Field(None, ge=20, le=300)
    night: float | None = Field(None, ge=20, le=300)
    protein: bool | None = None
    whitening: bool | None = None
    exercise: bool | None = None


def query(sql: str, *params) -> list[dict]:
    DB.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        con.execute(
            "create table if not exists days (date text primary key, morning real, night real,"
            " protein integer not null default 0, whitening integer not null default 0, exercise integer not null default 0)"
        )
        rows = [dict(r) for r in con.execute(sql, params).fetchall()]
        con.commit()
        return rows
    finally:
        con.close()


def check(*dates: str):
    if not all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) for d in dates):
        raise HTTPException(400, "日付は YYYY-MM-DD で指定してください")


@app.get("/api/days")
def days(start: str, end: str):
    check(start, end)
    return {
        "days": query("select * from days where date between ? and ? order by date desc", start, end),
        "lastWhitening": query("select max(date) as d from days where whitening = 1")[0]["d"],
    }


@app.put("/api/days/{date}")
def save(date: str, patch: Patch):
    check(date)
    values = {k: round(v, 1) if isinstance(v, float) else v for k, v in patch.model_dump(exclude_unset=True).items()}
    if not values:
        raise HTTPException(400, "更新する項目がありません")
    query("insert into days (date) values (?) on conflict(date) do nothing", date)
    query(f"update days set {', '.join(f'{k} = ?' for k in values)} where date = ?", *values.values(), date)
    return query("select * from days where date = ?", date)[0]


@app.get("/")
@app.get("/{name}")
def asset(name: str = "index.html"):
    if name not in FILES:
        raise HTTPException(404)
    return FileResponse(DIR / name)
