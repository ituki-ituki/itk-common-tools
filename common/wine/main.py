import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google import genai
from google.genai import types
from pydantic import BaseModel

ENV = Path(__file__).parents[2] / "private" / ".env"
LEDGER = Path(__file__).parent / "data" / "count.json"
LIMIT = 10
PROMPT = """あなたは滋賀県守山市の自然派ワイン専門店「AZURE BLUE」の、SNS投稿づくりを手伝います。
写真はボトル、続く文はオーナーのコメントと、飲んだ人の感想です。

- producer / name / region / grapes / vintage: ラベルから読み取る。カタカナ表記。読めないものは空文字。
- words: オーナーのコメントを原文のまま入れる。言い換え・追加・翻訳はしない。1要素1行、15文字前後で改行位置だけ整える。
- line: このワインのコンセプトが浮かび上がる一言。オーナーのコメントの言葉だけを使い、20文字以内。
- paper / ink: ラベル・ワインの色・コメントの雰囲気から決める、カードの紙色と文字色（#rrggbb）。読みやすいコントラストにする。
- caption: お店の人の口調のSNS投稿文。オーナーの言葉を軸に、飲んだ人の感想をさりげなく織り込む。200文字程度。ハッシュタグと絵文字は使わない。

オーナーのコメント:
{note}

飲んだ人の感想:
{taste}"""
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
async def compose(photo: UploadFile = File(...), note: str = Form(""), taste: str = Form("")):
    if used() >= LIMIT:
        raise HTTPException(429, "今日はもう作れません。明日またどうぞ")
    load_dotenv(ENV, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini APIキーが未設定です")
    client = genai.Client(api_key=key)
    try:
        reply = await client.aio.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"),
            contents=[
                types.Part.from_bytes(data=await photo.read(), mime_type=photo.content_type or "image/jpeg"),
                PROMPT.format(note=note[:1000], taste=taste[:1000]),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=Wine),
        )
        wine = Wine.model_validate(json.loads(reply.text))
    except Exception as e:
        raise HTTPException(502, f"うまく作れませんでした: {e}")
    spend()
    return {**wine.model_dump(), **left()}
