import json
import sys

call = json.load(sys.stdin)
if "sqlite" in json.dumps(call.get("tool_input", {}), ensure_ascii=False):
    print("db.sqlite は直接触れません。python3 wine.py を使ってください。", file=sys.stderr)
    sys.exit(2)
