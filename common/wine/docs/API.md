# API

AIのAPIキーをブラウザに出さないため、小さなバックエンド（`main.py`、systemd `wine.service`、ポート1010）を置く。nginxで `/common/wine/api/` をつなぐ。

## POST /common/wine/api/compose

- 入力（multipart）: `photo` ボトル写真（長辺1600pxに縮小したJPEG）、`note` お店のコメント、`taste` 飲んだ感想、`angle` 画角（空=おまかせ / `front` / `above` / `wide`）
- 出力: `producer` `name` `region` `grapes` `vintage`（ラベルから読み取り）、`words`（コメント原文を行に分けたもの）、`line`（一言）、`paper` `ink`（色）、`caption`（投稿文）、`scene`（場面の英語描写）、`image`（生成画像のdata URL。失敗時は空で、ブラウザは元の写真を使う）、`left`（今日の残り回数）
- 処理: テキストAI（`GEMINI_MODEL`）で言葉と `scene` を作り、続けて画像AI（`GEMINI_IMAGE_MODEL`、既定 `gemini-3.1-flash-image`）で正方形の画像を作る。2つ合わせて1回と数える。プロンプトは `prompts.py`。
- 1日10回（全体、日本時間で日付が変わるとリセット）を超えたら 429。回数は `data/count.json` に記録する。

## GET /common/wine/api/left

- 今日の残り回数 `{ "left": n }`

画像の合成はブラウザのcanvasで行う。サーバーはAIに問い合わせるだけ。
