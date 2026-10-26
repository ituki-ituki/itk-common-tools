WORDS = """あなたは滋賀県守山市の自然派ワイン専門店「AZURE BLUE」の、SNS投稿づくりを手伝います。
写真はボトル、続く文はお店のタグの文面と、飲んだ人の感想（空のこともある）です。

- caption: お店の人の口調のSNS投稿文。タグの言葉をできるだけ原文のまま軸にし、感想があればさりげなく織り込む。200文字程度。ハッシュタグと絵文字は使わない。
- scene: このワインのコンセプトが浮かび上がる写真の場面を英語で描写する。置き場所・背景・光・時間帯・添える小物・色調。

お店のタグ:
{note}

飲んだ人の感想:
{taste}"""

POSES = {
    "": "Choose the composition that best expresses the scene.",
    "glass": "The bottle standing with a glass of this wine poured beside it.",
    "low": "A low vertical angle looking up at the bottle, emphasizing its tall silhouette.",
    "close": "A close-up of the bottle's shoulder and label, shallow depth of field.",
    "basket": "The bottle resting in a wicker pouring basket, wine being poured into a glass. Only a hand may appear.",
}

MODELS = ["gemini-3.1-flash-image", "gemini-3-pro-image"]

SCENE = """Photograph this exact wine bottle in a new square photo.
Keep the bottle identical: same shape, glass color, capsule, and the label's design, colors and lettering. Do not invent new label text.
Scene: {scene}
Composition: {pose}
No people other than what the composition allows. Natural light, real photographic look, gentle film-like tone. No added text, logos or watermarks."""
