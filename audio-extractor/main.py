import asyncio
import json
import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from google import genai

ENV = Path(__file__).with_name(".env")
app = FastAPI()


async def ask(key: str, data: bytes, mime: str, prompt: str) -> str:
    client = genai.Client(api_key=key)
    with tempfile.NamedTemporaryFile() as tmp:
        tmp.write(data)
        tmp.flush()
        audio = await client.aio.files.upload(file=tmp.name, config={"mime_type": mime})
    try:
        while audio.state.name == "PROCESSING":
            await asyncio.sleep(2)
            audio = await client.aio.files.get(name=audio.name)
        model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
        reply = await client.aio.models.generate_content(model=model, contents=[audio, prompt])
        return (reply.text or "").strip()
    finally:
        await client.aio.files.delete(name=audio.name)


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), prompt: str = Form(...)):
    load_dotenv(ENV, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini APIキーが未設定です")
    task = asyncio.create_task(ask(key, await file.read(), file.content_type or "audio/aac", prompt))

    async def body():
        while not task.done():
            yield " "
            await asyncio.wait([task], timeout=15)
        try:
            yield json.dumps({"text": task.result()}, ensure_ascii=False)
        except Exception as e:
            yield json.dumps({"error": f"文字起こしに失敗しました: {e}"}, ensure_ascii=False)

    return StreamingResponse(body(), media_type="application/json")
