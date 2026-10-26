# API

AIのAPIキーをブラウザに出さないため、小さなバックエンド（`main.py`、systemd `wine.service`、ポート1010）を置く。nginxで `/common/wine/api/` をつなぐ。

## POST /common/wine/api/compose

- 入力（multipart）: `photo` ボトル写真（長辺1600pxに縮小したJPEG）、`note` お店のタグの文面、`taste` 飲んだ感想（任意）、`pose` 構図（空=おまかせ / `glass` / `low` / `close` / `basket`）、`model` 画像AI（`gemini-3.1-flash-image` / `gemini-3-pro-image`。それ以外はFlash）
- 出力: `caption`（投稿文）、`scene`（場面の英語描写）、`image`（生成画像のdata URL。失敗時は空で、ブラウザは元の写真を使う）、`left`（今日の残り回数）
- 処理: テキストAI（`GEMINI_MODEL`）で投稿文と `scene` を作り、続けて画像AIで正方形の画像を作る。2つ合わせて1回と数える。プロンプト・構図・モデルの一覧は `prompts.py`。
- 1日10回（全体、日本時間で日付が変わるとリセット）を超えたら 429。回数は `data/count.json` に記録する。

## GET /common/wine/api/left

- 今日の残り回数 `{ "left": n }`

画像の合成はブラウザのcanvasで行う。サーバーはAIに問い合わせるだけ。
