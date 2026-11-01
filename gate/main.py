import asyncio
import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel

ACCESS = Path(__file__).parents[1] / "access.json"
PKC = os.environ.get("PKC_URL", "http://127.0.0.1:8092")
TENANT = "yamagara"
SECRET = os.environ["GATE_SECRET"].encode()
COOKIE = "yg_session"
TTL = 10 * 24 * 3600
OPEN = {"", "index.html", "login.html", "gate", "gate.js", "imgs", "vendor", "base.js", "favicon.ico", "robots.txt"}
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


class Login(BaseModel):
    email: str
    password: str


def pack(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def sign(data: str) -> str:
    return pack(hmac.new(SECRET, data.encode(), hashlib.sha256).digest())


def holder(request: Request) -> dict | None:
    data, _, sig = request.cookies.get(COOKIE, "").partition(".")
    if not data or not hmac.compare_digest(sig, sign(data)):
        return None
    user = json.loads(base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)))
    return user if user["exp"] > time.time() else None


def public() -> set[str]:
    try:
        return {e["name"] for e in json.loads(ACCESS.read_text()) if e.get("isPublic") is True}
    except (OSError, ValueError, KeyError, TypeError):
        return set()


@app.get("/check")
def check(request: Request):
    top = request.headers.get("x-original-uri", "/").split("?")[0].lstrip("/").split("/")[0]
    forced = request.headers.get("x-private") == "1"
    if (not forced and (top in OPEN or top in public())) or holder(request):
        return Response(status_code=204)
    raise HTTPException(401)


@app.post("/login")
async def login(body: Login, response: Response):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{PKC}/api/collections/users/auth-with-password",
            params={"expand": "tenant_id"},
            json={"identity": body.email.strip(), "password": body.password},
        )
    record = r.json().get("record", {}) if r.status_code == 200 else {}
    if record.get("expand", {}).get("tenant_id", {}).get("code") != TENANT:
        await asyncio.sleep(1)
        raise HTTPException(401, "メールアドレスかパスワードが違います")
    data = pack(json.dumps({"id": record["id"], "name": record.get("name", ""), "email": record.get("email", ""), "exp": int(time.time()) + TTL}).encode())
    response.set_cookie(COOKIE, f"{data}.{sign(data)}", max_age=TTL, httponly=True, secure=True, samesite="lax", path="/")
    return {"name": record.get("name", "")}


@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE, path="/", secure=True, httponly=True, samesite="lax")
    return {}


@app.get("/me")
def me(request: Request):
    user = holder(request)
    if not user:
        raise HTTPException(401)
    return {"name": user["name"], "email": user["email"]}


@app.get("/tools")
def tools(request: Request):
    user = holder(request)
    return {"name": user["name"] if user else None, "public": sorted(public())}
