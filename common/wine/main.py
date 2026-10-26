import base64
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google import genai
from google.genai import types
from pydantic import BaseModel

from prompts import ANGLES, SCENE, WORDS

ENV = Path(__file__).parents[2] / "private" / ".env"
LEDGER = Path(__file__).parent / "data" / "count.json"
LIMIT = 10
app = FastAPI()


class Wine(BaseModel):
    producer: str
    name: str
    region: str
    grapes: str
    vintage: str
    words: list[str]
    line: str
    paper: str
    ink: str
    caption: str
    scene: str


def today():
    return datetime.now(timezone(timedelta(hours=9))).date().isoformat()


def used():
    data = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
    return data.get(today(), 0)


def spend():
    LEDGER.parent.mkdir(exist_ok=True)
    LEDGER.write_text(json.dumps({today(): used() + 1}))


async def shoot(client, photo, wine, angle):
    try:
        reply = await client.aio.models.generate_content(
            model=os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image"),
            contents=[photo, SCENE.format(scene=wine.scene, angle=ANGLES.get(angle, ANGLES[""]))],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="1:1"),
            ),
        )
        part = next(p for p in reply.candidates[0].content.parts if p.inline_data)
        return f"data:{part.inline_data.mime_type};base64,{base64.b64encode(part.inline_data.data).decode()}"
    except Exception:
        return ""


@app.get("/left")
def left():
    return {"left": max(LIMIT - used(), 0)}


@app.post("/compose")
async def compose(photo: UploadFile = File(...), note: str = Form(""), taste: str = Form(""), angle: str = Form("")):
    if used() >= LIMIT:
        raise HTTPException(429, "今日はもう作れません。明日またどうぞ")
    load_dotenv(ENV, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini APIキーが未設定です")
    client = genai.Client(api_key=key)
    shot = types.Part.from_bytes(data=await photo.read(), mime_type=photo.content_type or "image/jpeg")
    try:
        reply = await client.aio.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"),
            contents=[shot, WORDS.format(note=note[:1000], taste=taste[:1000])],
            config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=Wine),
        )
        wine = Wine.model_validate(json.loads(reply.text))
    except Exception as e:
        raise HTTPException(502, f"うまく作れませんでした: {e}")
    image = await shoot(client, shot, wine, angle)
    spend()
    return {**wine.model_dump(), "image": image, **left()}
