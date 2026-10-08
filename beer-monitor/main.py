import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

ENV = Path(__file__).parent.parent / ".env"
PROMPT = (
    "写真に写っているビール（ジョッキ・グラス・ピッチャー・ビールタワーなど、中身が見える容器）をすべて見つけてください。"
    "それぞれについて、容器を満杯にしたときに対する今のビールの量（泡は除いた液体部分）を 0〜100 の整数で推定し percent に入れてください。"
    "label には容器の種類を「ジョッキ」「グラス」「タワー」「ピッチャー」のような5文字以内の日本語で入れてください。"
    "box には容器全体を囲む [ymin, xmin, ymax, xmax] を 0〜1000 に正規化した整数で入れてください。"
    "左にあるものから順に並べてください。ビールが写っていなければ items は空にしてください。"
)
app = FastAPI()


class Beer(BaseModel):
    label: str
    percent: int = Field(ge=0, le=100)
    box: list[int]


class Scan(BaseModel):
    items: list[Beer]


@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    load_dotenv(ENV, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini APIキーが未設定です")
    client = genai.Client(api_key=key)
    try:
        reply = await client.aio.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"),
            contents=[types.Part.from_bytes(data=await file.read(), mime_type=file.content_type or "image/jpeg"), PROMPT],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Scan,
                thinking_config=types.ThinkingConfig(thinking_level="low"),
            ),
        )
        return Scan.model_validate(json.loads(reply.text))
    except Exception as e:
        raise HTTPException(502, f"解析に失敗しました: {e}")
