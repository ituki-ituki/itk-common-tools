import sqlite3
from contextlib import closing, contextmanager
from datetime import date
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB = Path(__file__).parent / "data" / "db.sqlite"
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@contextmanager
def connect():
    DB.parent.mkdir(exist_ok=True)
    with closing(sqlite3.connect(DB, timeout=10)) as con, con:
        con.row_factory = sqlite3.Row
        con.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, memo TEXT NOT NULL DEFAULT '')")
        yield con


class New(BaseModel):
    name: str


class Change(BaseModel):
    done: bool | None = None
    memo: str | None = None


@app.get("/tasks")
def tasks():
    with connect() as con:
        return [dict(r) for r in con.execute("SELECT id, name, created, memo FROM tasks WHERE done = 0 ORDER BY id DESC")]


@app.post("/tasks")
def add(body: New):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "タスク名を入れてください")
    with connect() as con:
        cur = con.execute("INSERT INTO tasks (name, created) VALUES (?, ?)", (name, date.today().isoformat()))
        return dict(con.execute("SELECT id, name, created, memo FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone())


@app.patch("/tasks/{tid}")
def change(tid: int, body: Change):
    with connect() as con:
        if body.done is not None:
            con.execute("UPDATE tasks SET done = ? WHERE id = ?", (int(body.done), tid))
        if body.memo is not None:
            con.execute("UPDATE tasks SET memo = ? WHERE id = ?", (body.memo, tid))
    return {}
