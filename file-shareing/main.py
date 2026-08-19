import os, secrets
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse

load_dotenv(Path(__file__).with_name(".env"))
app = FastAPI()
DIR = Path(__file__).parent
GOKAPI = os.environ["GOKAPI_URL"].rstrip("/")
APIKEY = os.environ["GOKAPI_API_KEY"]


@app.get("/")
def index():
    return FileResponse(DIR / "index.html")


@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    expiry_days: int = Form(0),
    use_password: int = Form(0),
):
    pw = secrets.token_urlsafe(9) if use_password else ""
    async with httpx.AsyncClient(timeout=600) as c:
        r = await c.post(
            f"{GOKAPI}/api/files/add",
            headers={"apikey": APIKEY},
            data={
                "allowedDownloads": "0",
                "expiryDays": str(expiry_days),
                "password": pw,
            },
            files={"file": (file.filename or "share.zip", await file.read(), file.content_type or "application/zip")},
        )
    r.raise_for_status()
    info = r.json()["FileInfo"]
    url = info.get("UrlHotlink") or info.get("UrlDownload") or info["UrlFull"]
    return {"url": url, "password": pw or None}
