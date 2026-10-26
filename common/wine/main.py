import base64
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google import genai
from google.genai import types

from prompts import MODELS, POSES, SCENE

ENV = Path(__file__).parents[2] / "private" / ".env"
LEDGER = Path(__file__).parent / "data" / "count.json"
LIMIT = 10
app = FastAPI()


def today():
    return datetime.now(timezone(timedelta(hours=9))).date().isoformat()


def used():
    data = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
    return data.get(today(), 0)


def spend():
    LEDGER.parent.mkdir(exist_ok=True)
    LEDGER.write_text(json.dumps({today(): used() + 1}))


@app.get("/left")
def left():
    return {"left": max(LIMIT - used(), 0)}


@app.post("/compose")
async def compose(photo: UploadFile = File(...), note: str = Form(""), pose: str = Form(""), model: str = Form("")):
    if used() >= LIMIT:
        raise HTTPException(429, "今日はもう作れません。明日またどうぞ")
    load_dotenv(ENV, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini APIキーが未設定です")
    try:
        reply = await genai.Client(api_key=key).aio.models.generate_content(
            model=model if model in MODELS else MODELS[0],
            contents=[
                types.Part.from_bytes(data=await photo.read(), mime_type=photo.content_type or "image/jpeg"),
                SCENE.format(note=note[:1000], pose=POSES.get(pose, "")),
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="1:1"),
            ),
        )
        part = next(p for p in reply.candidates[0].content.parts if p.inline_data)
    except Exception as e:
        raise HTTPException(502, f"うまく作れませんでした: {e}")
    spend()
    image = f"data:{part.inline_data.mime_type};base64,{base64.b64encode(part.inline_data.data).decode()}"
    return {"image": image, **left()}
