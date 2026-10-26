# API

AIのAPIキーをブラウザに出さないため、小さなバックエンド（`main.py`、systemd `wine.service`、ポート1010）を置く。nginxで `/common/wine/api/` をつなぐ。

## POST /common/wine/api/compose

- 入力（multipart）: `photo` ボトル写真（長辺1600pxに縮小したJPEG）、`note` お店のタグの文面、`pose` 構図（空=おまかせ / `glass` / `low` / `close` / `basket`）、`model` 画像AI（`gemini-3.1-flash-image` / `gemini-3-pro-image`。それ以外はFlash）
- 出力: `image`（生成した正方形画像のdata URL）、`left`（今日の残り回数）
- 処理: 写真とタグを画像AIに1回渡すだけ。プロンプト・構図・モデルの一覧は `prompts.py`。
- 1日10回（全体、日本時間で日付が変わるとリセット）を超えたら 429。回数は `data/count.json` に記録する。生成に失敗したら 502 で、回数は減らない。

## GET /common/wine/api/left

- 今日の残り回数 `{ "left": n }`

ロゴの合成はブラウザのcanvasで行う。
