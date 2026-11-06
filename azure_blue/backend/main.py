from datetime import date

from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from pydantic import BaseModel

from db import connect, load
from export import build
from gemini import read
from match import remember, resolve

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


class Row(BaseModel):
    item: str = ""
    name: str
    qty: float
    price: float
    amount: float
    fee: bool
    code: str | None = None
    wine: str = ""


class Supplier(BaseModel):
    code: str
    name: str


class Bill(BaseModel):
    supplier_code: str
    invoice: str = ""
    date: date
    lines: list[Row]


@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    try:
        usage = {}
        slip = await read(await file.read(), file.content_type or "image/jpeg", usage)
        result = await resolve(slip, usage)
        print("usage", slip.supplier, usage, flush=True)
        return result
    except Exception as e:
        raise HTTPException(502, f"読み取りに失敗しました: {e}")


@app.get("/masters")
def masters():
    con = connect()
    pick = lambda t: [dict(r) for r in con.execute(f"SELECT code, name FROM {t} ORDER BY name")]
    return {"wines": pick("wines"), "suppliers": pick("suppliers")}


@app.post("/suppliers")
def add_supplier(body: Supplier):
    code, name = body.code.strip(), body.name.strip()
    if not code or not name:
        raise HTTPException(400, "コードと名前を入れてください")
    con = connect()
    if con.execute("SELECT 1 FROM suppliers WHERE code = ?", (code,)).fetchone():
        raise HTTPException(409, f"コード {code} は登録済みです")
    load(con, "suppliers", [{"code": code, "name": name}])
    con.commit()
    return {"code": code, "name": name}


@app.post("/export")
def export(bills: list[Bill]):
    con = connect()
    slips = [b.model_dump(mode="json") for b in bills if b.lines]
    if any(not l["fee"] and not l["code"] for s in slips for l in s["lines"]):
        raise HTTPException(400, "商品が未選択の明細があります")
    for s in slips:
        remember(con, s["supplier_code"], s["lines"])
    data = build(con, slips)
    con.commit()
    name = f"shiire_{date.today():%Y%m%d}.csv"
    return Response(data, media_type="text/csv; charset=shift_jis", headers={"Content-Disposition": f'attachment; filename="{name}"'})
