import calendar
import csv
import io
from datetime import date

WIDTH = 42


def due(day: date) -> date:
    y, m = (day.year + 1, 1) if day.month == 12 else (day.year, day.month + 1)
    return date(y, m, calendar.monthrange(y, m)[1])


def serial(con, day: date) -> str:
    key = day.strftime("%y%m%d")
    con.execute("INSERT INTO serials VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1", (key,))
    n = con.execute("SELECT n FROM serials WHERE day = ?", (key,)).fetchone()["n"]
    return f"{key}{n:04d}"


def num(v: float) -> str:
    return f"{v:g}"


def rows(con, slip: dict) -> list[list[str]]:
    day = date.fromisoformat(slip["date"])
    master = con.execute("SELECT invoice FROM suppliers WHERE code = ?", (slip["supplier_code"],)).fetchone()
    qualified = "1" if (master and master["invoice"]) or slip.get("invoice") else "0"
    head = {
        1: serial(con, day), 2: day.strftime("%Y/%m/%d"), 3: "2", 5: "1",
        7: slip["supplier_code"], 8: slip["supplier_code"], 9: "4", 13: due(day).strftime("%Y/%m/%d"),
    }
    out = []
    for i, line in enumerate(slip["lines"], 1):
        body = {21: str(i), 36: num(line["qty"]), 38: num(line["price"]), 39: "1", 41: num(line["amount"]), 42: qualified}
        body |= {22: "5", 26: line["name"][:40]} if line["fee"] else {22: "1", 25: line["code"], 26: line["wine"][:40]}
        cols = head | body
        out.append([cols.get(c, "") for c in range(1, WIDTH + 1)])
    return out


def build(con, slips: list[dict]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\r\n")
    for slip in slips:
        writer.writerows(rows(con, slip))
    return buf.getvalue().encode("cp932", errors="replace")
