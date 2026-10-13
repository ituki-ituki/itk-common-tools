import asyncio
import os
import re
import shutil
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse
from google import genai
from google.genai import types
from pydantic import BaseModel

ENV = Path(__file__).parent.parent / ".env"
WORK = Path("/var/tmp/subtitler")
STYLE = "FontName=IPAGothic,FontSize=18,Outline=2,Shadow=0,MarginV=24"
PROMPT = (
    "この音声の日本語字幕を作ってください。"
    "話している内容を正確に書き起こし、「えー」「あの」などのフィラーは省いてください。"
    "字幕は自然な区切りで分け、1つの字幕は全角30文字以内にしてください。"
    "start と end は音声の先頭からの秒数（小数可）で、実際に話している区間に合わせてください。"
)
app = FastAPI()
jobs: dict[str, dict] = {}
tasks: set[asyncio.Task] = set()


class Line(BaseModel):
    start: float
    end: float
    text: str


class Subs(BaseModel):
    lines: list[Line]


def folder(job: str) -> Path:
    if not re.fullmatch(r"[0-9a-f]{32}", job):
        raise HTTPException(400, "不正なIDです")
    return WORK / job


def stamp(sec: float) -> str:
    ms = round(sec * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


async def sh(*args, cwd: Path) -> asyncio.subprocess.Process:
    return await asyncio.create_subprocess_exec(*map(str, args), cwd=cwd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)


async def caption(audio: bytes) -> Subs:
    load_dotenv(ENV, override=True)
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    reply = await client.aio.models.generate_content(
        model=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"),
        contents=[types.Part.from_bytes(data=audio, mime_type="audio/aac"), PROMPT],
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=Subs),
    )
    return Subs.model_validate_json(reply.text)


async def run(job: str, speed: float):
    status, cwd = jobs[job], folder(job)
    try:
        p = await sh("ffmpeg", "-v", "error", "-y", "-i", "src.mp4", "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "64k", "-f", "adts", "audio.aac", cwd=cwd)
        if await p.wait():
            raise RuntimeError("音声を取り出せませんでした")
        subs = await caption((cwd / "audio.aac").read_bytes())
        (cwd / "sub.srt").write_text("\n".join(f"{i}\n{stamp(l.start)} --> {stamp(l.end)}\n{l.text}\n" for i, l in enumerate(subs.lines, 1)))
        p = await sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "src.mp4", cwd=cwd)
        length = float((await p.communicate())[0]) / speed
        status.update(state="動画を作成中", progress=0)
        p = await sh(
            "ffmpeg", "-v", "error", "-y", "-i", "src.mp4",
            "-vf", f"subtitles=sub.srt:force_style='{STYLE}'," * bool(subs.lines) + f"setpts=PTS/{speed}", "-af", f"atempo={speed}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", "-progress", "pipe:1", "out.mp4", cwd=cwd,
        )
        async for line in p.stdout:
            if line.startswith(b"out_time_us=") and line[12:].strip().isdigit():
                status["progress"] = min(99, int(int(line[12:]) / 1e6 / length * 100))
        if await p.wait():
            raise RuntimeError("動画の作成に失敗しました")
        status.update(state="完成", progress=100)
    except Exception as e:
        status.update(state="エラー", error=str(e))


@app.put("/upload/{job}/{index}")
async def upload(job: str, index: int, request: Request):
    cwd = folder(job)
    cwd.mkdir(parents=True, exist_ok=True)
    (cwd / f"part{index:04}").write_bytes(await request.body())
    return {"ok": True}


@app.post("/start/{job}")
async def start(job: str, speed: float = Form(...), name: str = Form("video.mp4")):
    cwd = folder(job)
    parts = sorted(cwd.glob("part*"))
    if not parts:
        raise HTTPException(400, "動画が届いていません")
    with (cwd / "src.mp4").open("wb") as out:
        for part in parts:
            with part.open("rb") as f:
                shutil.copyfileobj(f, out)
            part.unlink()
    for old in WORK.iterdir():
        if time.time() - old.stat().st_mtime > 6 * 3600:
            shutil.rmtree(old, ignore_errors=True)
    jobs[job] = {"state": "字幕を作成中", "progress": 0, "name": Path(name).stem + "_字幕.mp4"}
    task = asyncio.create_task(run(job, min(2.0, max(1.0, speed))))
    tasks.add(task)
    task.add_done_callback(tasks.discard)
    return jobs[job]


@app.get("/status/{job}")
def status(job: str):
    if job not in jobs:
        raise HTTPException(404, "処理が見つかりません")
    return jobs[job]


@app.get("/result/{job}")
def result(job: str):
    out = folder(job) / "out.mp4"
    if jobs.get(job, {}).get("state") != "完成" or not out.exists():
        raise HTTPException(404, "まだ完成していません")
    return FileResponse(out, media_type="video/mp4", filename=jobs[job]["name"])
