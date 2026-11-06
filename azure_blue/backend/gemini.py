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


class Pick(BaseModel):
    n: int
    code: str | None


async def ask(contents: list, schema):
    load_dotenv(ENV, override=True)
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    reply = await client.aio.models.generate_content(
        model=os.environ.get("AZURE_MODEL", "gemini-3.5-flash-lite"),
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=schema, temperature=0),
    )
    return json.loads(reply.text)


async def read(image: bytes, mime: str) -> Slip:
    prompt = (PROMPTS / "read.md").read_text()
    return Slip.model_validate(await ask([types.Part.from_bytes(data=image, mime_type=mime), prompt], Slip))


async def pick(rows: list[dict]) -> dict[int, str | None]:
    if not rows:
        return {}
    prompt = (PROMPTS / "pick.md").read_text()
    picks = await ask([prompt, json.dumps(rows, ensure_ascii=False)], list[Pick])
    return {p["n"]: p["code"] for p in picks}
