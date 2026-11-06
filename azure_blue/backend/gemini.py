import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

ENV = Path("/root/assets/private/.env")
PROMPTS = Path(__file__).parent / "prompts"


class Line(BaseModel):
    item: str
    name: str
    qty: float
    price: float
    amount: float
    fee: bool


class Slip(BaseModel):
    supplier: str
    invoice: str
    date: str
    number: str
    lines: list[Line]
    printed_qty: float | None
    printed_amount: float | None


class Draft(BaseModel):
    name: str
    kana: str
    short: str
    initial_kana: str
    initial_en: str


class Pick(BaseModel):
    n: int
    code: str | None


async def ask(contents: list, schema, usage: dict):
    load_dotenv(ENV, override=True)
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    usage["model"] = os.environ.get("AZURE_MODEL", "gemini-3.5-flash-lite")
    reply = await client.aio.models.generate_content(
        model=usage["model"],
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=schema, temperature=0),
    )
    meta = reply.usage_metadata
    usage["input"] = usage.get("input", 0) + (meta.prompt_token_count or 0)
    usage["output"] = usage.get("output", 0) + (meta.total_token_count or 0) - (meta.prompt_token_count or 0)
    return json.loads(reply.text)


async def read(image: bytes, mime: str, usage: dict) -> Slip:
    prompt = (PROMPTS / "read.md").read_text()
    return Slip.model_validate(await ask([types.Part.from_bytes(data=image, mime_type=mime), prompt], Slip, usage))


async def pick(rows: list[dict], usage: dict) -> dict[int, str | None]:
    if not rows:
        return {}
    prompt = (PROMPTS / "pick.md").read_text()
    picks = await ask([prompt, json.dumps(rows, ensure_ascii=False)], list[Pick], usage)
    return {p["n"]: p["code"] for p in picks}


async def draft(name: str, usage: dict) -> dict:
    prompt = (PROMPTS / "draft.md").read_text()
    return await ask([prompt, name], Draft, usage)
