import re

from db import connect, search
from gemini import Slip, pick


def supplier(con, slip: Slip) -> str | None:
    invoice = re.sub(r"\D", "", slip.invoice)
    if invoice:
        row = con.execute("SELECT code FROM suppliers WHERE replace(invoice, 'T', '') = ?", (invoice,)).fetchone()
        if row:
            return row["code"]
    hits = search(con, "suppliers", slip.supplier, 1)
    return hits[0] if hits else None


def learned(con, who: str | None, item: str) -> str | None:
    row = con.execute("SELECT wine FROM learned WHERE supplier = ? AND item = ?", (who, item)).fetchone() if who and item else None
    return row["wine"] if row else None


async def resolve(slip: Slip, usage: dict) -> dict:
    with connect() as con:
        names = {r["code"]: r["name"] for r in con.execute("SELECT code, name FROM wines")}
        who = supplier(con, slip)
        lines, asks = [], []
        for n, line in enumerate(slip.lines):
            row = line.model_dump() | {"n": n, "code": None, "by": ""}
            if not line.fee:
                row["code"] = learned(con, who, line.item)
                row["by"] = "learned" if row["code"] else ""
                if not row["code"]:
                    hits = search(con, "wines", line.name)
                    asks.append({"n": n, "name": line.name, "candidates": [{"code": c, "name": names[c]} for c in hits]})
            lines.append(row)
        for n, code in (await pick([a for a in asks if a["candidates"]], usage)).items():
            valid = any(c["code"] == code for a in asks if a["n"] == n for c in a["candidates"])
            if valid:
                lines[n] |= {"code": code, "by": "ai"}
        return slip.model_dump(exclude={"lines"}) | {"supplier_code": who, "lines": lines, "usage": usage}


def remember(con, who: str, lines: list[dict]) -> None:
    rows = [(who, l["item"], l["code"]) for l in lines if l.get("item") and l.get("code") and not l.get("fee")]
    con.executemany("INSERT OR REPLACE INTO learned VALUES (?, ?, ?)", rows)
