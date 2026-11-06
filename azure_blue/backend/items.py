import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import connect, load
from gemini import draft

router = APIRouter()


class Hint(BaseModel):
    name: str


class Item(BaseModel):
    name: str
    kana: str
    short: str
    initial_kana: str = ""
    initial_en: str = ""
    retail: int
    price: int
    price1: int
    cost: float


@router.post("/draft")
async def suggest(body: Hint):
    try:
        return await draft(body.name, {})
    except Exception as e:
        raise HTTPException(502, f"下書きに失敗しました: {e}")


@router.post("/wines")
def add_wine(body: Item):
    if not body.name.strip():
        raise HTTPException(400, "商品名を入れてください")
    with connect() as con:
        top = con.execute("SELECT max(CAST(code AS INTEGER)) FROM wines WHERE code NOT GLOB '*[^0-9]*'").fetchone()[0]
        code = str((top or 0) + 1)
        item = body.model_dump() | {"code": code, "cost": f"{body.cost:g}"}
        load(con, "wines", [{"code": code, "name": body.name.strip(), "short": body.short}])
        con.execute("INSERT INTO drafts VALUES (?, ?)", (code, json.dumps(item, ensure_ascii=False)))
        con.commit()
        return {"code": code, "name": body.name.strip()}


def pending(con) -> list[dict]:
    return [json.loads(r["data"]) for r in con.execute("SELECT data FROM drafts ORDER BY CAST(code AS INTEGER)")]
