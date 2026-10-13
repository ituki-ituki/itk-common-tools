import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "http://127.0.0.1:8090/api"
RECORDS = f"{API}/collections/knowledge/records"
USAGE = """usage:
  kb.py list [カテゴリー]
  kb.py add <カテゴリー> <中身>
  kb.py add-many            (stdin: [{"category": ..., "content": ...}])
  kb.py update <id> [--category X] [--content Y]
  kb.py delete <id>"""


def call(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json", **({"Authorization": token} if token else {})}
    body = json.dumps(data).encode() if data is not None else None
    with urllib.request.urlopen(urllib.request.Request(url, body, headers, method=method)) as r:
        raw = r.read()
    return json.loads(raw) if raw else None


def login():
    for line in (Path(__file__).parent.parent / ".env").read_text().splitlines():
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())
    auth = {"identity": os.environ["PB_EMAIL"], "password": os.environ["PB_PASSWORD"]}
    return call(f"{API}/collections/_superusers/auth-with-password", "POST", auth)["token"]


def entries(token, category=None):
    items, page = [], 1
    while True:
        query = {"page": page, "perPage": 500, "sort": "category,created", **({"filter": f'category="{category}"'} if category else {})}
        result = call(f"{RECORDS}?{urllib.parse.urlencode(query)}", token=token)
        items += [{k: i[k] for k in ("id", "category", "content")} for i in result["items"]]
        if page >= result["totalPages"]:
            return items
        page += 1


def options(args):
    return {args[i][2:]: args[i + 1] for i in range(0, len(args), 2)}


def main(cmd, *args):
    token = login()
    if cmd == "list":
        out = entries(token, *args[:1])
    elif cmd == "add":
        out = call(RECORDS, "POST", {"category": args[0], "content": args[1]}, token)
    elif cmd == "add-many":
        out = [call(RECORDS, "POST", item, token)["id"] for item in json.load(sys.stdin)]
    elif cmd == "update":
        out = call(f"{RECORDS}/{args[0]}", "PATCH", options(args[1:]), token)
    elif cmd == "delete":
        out = call(f"{RECORDS}/{args[0]}", "DELETE", token=token) or {"deleted": args[0]}
    else:
        raise SystemExit(USAGE)
    print(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(USAGE)
    try:
        main(*sys.argv[1:])
    except urllib.error.HTTPError as e:
        raise SystemExit(f"error {e.code}: {e.read().decode()}")
