import json
import sqlite3
import sys
from datetime import date
from pathlib import Path

db = sqlite3.connect(Path(__file__).with_name("db.sqlite"))
db.row_factory = sqlite3.Row
LABEL = "w.producer || ' ' || w.name || ' ' || w.vintage"
LEFT = "(SELECT COALESCE(SUM(qty),0) FROM buys WHERE wine=w.id) - (SELECT COALESCE(SUM(qty),0) FROM sales WHERE wine=w.id)"
COLORS = ("赤", "白", "オレンジ", "泡", "ロゼ")


class Stop(Exception):
    pass


def rows(sql, args=()):
    return [dict(r) for r in db.execute(sql, args)]


def match(text):
    text = str(text)
    if text.isdigit():
        return rows(f"SELECT w.id, {LABEL} AS label FROM wines w WHERE w.id=?", (int(text),))
    words = text.split() or [""]
    where = " AND ".join([f"{LABEL} LIKE ?"] * len(words))
    return rows(f"SELECT w.id, {LABEL} AS label FROM wines w WHERE {where}", [f"%{x}%" for x in words])


def scope(q, t, col="wine"):
    cond, args = ["1"], []
    for key, op in (("from", ">="), ("to", "<=")):
        if key in q:
            cond.append(f"{t}.date {op} ?")
            args.append(q[key])
    if "wine" in q:
        ids = [m["id"] for m in match(q["wine"])]
        cond.append(f"{t}.{col} IN ({','.join('?' * len(ids)) or 'NULL'})")
        args += ids
    for key in ("client", "supplier"):
        if key in q:
            cond.append(f"{t}.{key} LIKE ?")
            args.append(f"%{q[key]}%")
    return " AND ".join(cond), args


def need(q, keys):
    lack = [k for k in keys if q.get(k) in (None, "")]
    if lack:
        raise Stop({"missing": lack})


def valid(q, money):
    for key, low in (("qty", 1), (money, 0)):
        if not isinstance(q[key], int) or q[key] < low:
            raise Stop({"error": f"{key} は {low} 以上の整数"})
    date.fromisoformat(q["date"])


def pick(q, new):
    found = match(q["wine"])
    if len(found) == 1:
        return found[0]["id"]
    if found:
        raise Stop({"candidates": found})
    if not new:
        raise Stop({"error": "ワインが見つからない", "candidates": []})
    need(q, ("producer", "name", "vintage", "color"))
    if q["color"] not in COLORS:
        raise Stop({"error": f"color は {'/'.join(COLORS)}"})
    cur = db.execute("INSERT INTO wines(producer,name,vintage,color) VALUES(?,?,?,?)", (q["producer"], q["name"], q["vintage"], q["color"]))
    return cur.lastrowid


def stock(q):
    where, args = scope(q, "w", "id")
    return {"wines": rows(f"SELECT w.id, {LABEL} AS label, w.color, {LEFT} AS stock FROM wines w WHERE {where} ORDER BY w.id", args)}


def buys(q):
    where, args = scope(q, "b")
    sql = f"SELECT b.date, w.id, {LABEL} AS label, b.qty, b.cost, b.supplier FROM buys b JOIN wines w ON w.id=b.wine WHERE {where} ORDER BY b.date DESC"
    return {"buys": rows(sql, args)}


def sales(q):
    where, args = scope(q, "s")
    sql = f"SELECT w.id, {LABEL} AS label, SUM(s.qty) AS qty, SUM(s.qty*s.price) AS amount FROM sales s JOIN wines w ON w.id=s.wine WHERE {where} GROUP BY w.id ORDER BY qty DESC"
    found = rows(sql, args)
    return {"sales": found, "total": {k: sum(r[k] for r in found) for k in ("qty", "amount")}}


def buy(q):
    need(q, ("wine", "qty", "cost", "date"))
    valid(q, "cost")
    w = pick(q, True)
    db.execute("INSERT INTO buys(date,wine,qty,cost,supplier) VALUES(?,?,?,?,?)", (q["date"], w, q["qty"], q["cost"], q.get("supplier", "")))
    db.commit()
    return {"done": "buy", **stock({"wine": w})["wines"][0]}


def sell(q):
    need(q, ("wine", "qty", "price", "client", "date"))
    valid(q, "price")
    w = pick(q, False)
    left = stock({"wine": w})["wines"][0]["stock"]
    if left < q["qty"]:
        raise Stop({"error": "在庫不足", "stock": left})
    db.execute("INSERT INTO sales(date,wine,qty,price,client) VALUES(?,?,?,?,?)", (q["date"], w, q["qty"], q["price"], q["client"]))
    db.commit()
    return {"done": "sell", **stock({"wine": w})["wines"][0]}


CMDS = {f.__name__: f for f in (stock, buys, sales, buy, sell)}

if __name__ == "__main__":
    cmd = CMDS.get(sys.argv[1] if len(sys.argv) > 1 else "")
    try:
        if not cmd:
            raise Stop({"error": "cmd は " + " / ".join(CMDS)})
        out = {"ok": True, **cmd(json.loads(sys.argv[2]) if len(sys.argv) > 2 else {})}
    except Stop as e:
        out = {"ok": False, **e.args[0]}
    except Exception as e:
        out = {"ok": False, "error": str(e)}
    print(json.dumps(out, ensure_ascii=False, indent=1))
