import ipaddress
import socket
from pathlib import Path
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse

app = FastAPI()
DIR = Path(__file__).parent


@app.get("/")
@app.get("/index.html")
def index():
    return FileResponse(DIR / "index.html")


@app.get("/favicon.png")
def favicon():
    return FileResponse(DIR / "favicon.png")


def _assert_public_host(hostname: str):
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(400, "URLのホストを解決できませんでした")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise HTTPException(400, "このURLは許可されていません")


@app.get("/ical")
async def ical(url: str = Query(...)):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(400, "http/https のURLを指定してください")
    _assert_public_host(parsed.hostname)

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=False) as c:
            r = await c.get(url)
    except httpx.HTTPError:
        raise HTTPException(502, "カレンダーの取得に失敗しました")
    if r.is_redirect:
        raise HTTPException(400, "リダイレクトされるURLは使用できません。最終的なURLを指定してください")
    if r.is_error:
        raise HTTPException(502, "カレンダーの取得に失敗しました")
    return PlainTextResponse(r.text, media_type="text/calendar")