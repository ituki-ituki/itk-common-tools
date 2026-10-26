WORDS = """あなたは滋賀県守山市の自然派ワイン専門店「AZURE BLUE」の、SNS投稿づくりを手伝います。
写真はボトル、続く文はオーナーのコメントと、飲んだ人の感想です。

- producer / name / region / grapes / vintage: ラベルから読み取る。カタカナ表記。読めないものは空文字。
- words: オーナーのコメントを原文のまま入れる。言い換え・追加・翻訳はしない。1要素1行、15文字前後で改行位置だけ整える。
- line: このワインのコンセプトが浮かび上がる一言。オーナーのコメントの言葉だけを使い、20文字以内。
- paper / ink: ラベル・ワインの色・コメントの雰囲気から決める、カードの紙色と文字色（#rrggbb）。読みやすいコントラストにする。
- caption: お店の人の口調のSNS投稿文。オーナーの言葉を軸に、飲んだ人の感想をさりげなく織り込む。200文字程度。ハッシュタグと絵文字は使わない。
- scene: このワインのコンセプトが浮かび上がる写真の場面を英語で描写する。置き場所・背景・光・時間帯・添える小物・色調。人物は入れない。

オーナーのコメント:
{note}

飲んだ人の感想:
{taste}"""

ANGLES = {
    "": "Choose the camera angle that best expresses the scene.",
    "front": "Eye-level, close and front-facing, the label fills a good part of the frame.",
    "above": "High angle looking down at a table, the bottle lying or standing among the props.",
    "wide": "A wider view, the bottle placed naturally within the surrounding scene.",
}

SCENE = """Photograph this exact wine bottle in a new square photo.
Keep the bottle identical: same shape, glass color, capsule, and the label's design, colors and lettering. Do not invent new label text.
Scene: {scene}
Camera: {angle}
Natural light, real photographic look, gentle film-like tone. No added text, logos or watermarks."""
