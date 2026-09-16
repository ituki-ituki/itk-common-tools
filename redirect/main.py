import json
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, PlainTextResponse, RedirectResponse

app = FastAPI()
DIR = Path(__file__).parent
DATA_FILE = DIR / "data" / "target.json"


def load_target() -> str:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text()).get("url", "")
    return ""


def save_target(url: str):
    DATA_FILE.parent.mkdir(exist_ok=True)
    DATA_FILE.write_text(json.dumps({"url": url}))


@app.get("/common/redirect")
@app.get("/common/redirect/")
def redirect_root():
    url = load_target()
    if not url:
        return PlainTextResponse("リダイレクト先が設定されていません", status_code=404)
    return RedirectResponse(url, status_code=302)


@app.get("/common/redirect/console")
def console():
    return FileResponse(DIR / "console.html")


@app.get("/common/redirect/console/api/target")
def get_target():
    return {"url": load_target()}


@app.post("/common/redirect/console/api/target")
async def set_target(request: Request):
    body = await request.json()
    url = (body.get("url") or "").strip()
    if url:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise HTTPException(400, "http/https のURLを指定してください")
    save_target(url)
    return {"url": url}
